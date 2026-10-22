import CryptoJS from "crypto-js";
import SaltManager from "./saltManager";
import { supabase } from "../supabaseClient.ts";

interface EncryptionResult {
    encryptedData: string;
    salt: string;
}

interface DecryptionResult {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
}

interface LegacyStoredUserKey {
    userId: string;
    key: string;
    expiresAt: number;
}

interface WrappedStoredUserKey {
    version: 2;
    userId: string;
    encryptedKey: string;
    iv: string;
    expiresAt: number;
}

type StoredUserKey = LegacyStoredUserKey | WrappedStoredUserKey;

interface PdfMetadataRecord {
    id: string;
    file_path: string;
    date_of_absence: string;
    reason: string;
    pdf_name: string;
}

const TEXT_CIPHERTEXT_PREFIX = "absendo:v2:";
const BLOB_MAGIC = new TextEncoder().encode("ABSENDO2");
const GCM_IV_LENGTH = 12;
const SENSITIVE_PROFILE_FIELDS = [
    "first_name",
    "last_name",
    "birthday",
    "calendar_url",
    "first_name_trainer",
    "last_name_trainer",
    "phone_number_trainer",
    "email_trainer",
] as const;

class EncryptionService {
    private static instance: EncryptionService;
    private userKey: string | null = null;
    private readonly saltManager: SaltManager;
    private currentUserId: string | null = null;
    private readonly sessionKeyStorageKey = "absendo_session_user_key";
    private readonly persistentKeyStoragePrefix = "absendo_persistent_user_key:";
    private readonly persistentKeyTtlMs = 90 * 24 * 60 * 60 * 1000;
    private readonly keyDatabaseName = "absendo_secure_storage";
    private readonly keyDatabaseStore = "device_keys";
    private readonly deviceKeyId = "local_key_wrapper_v1";

    private constructor() {
        this.saltManager = SaltManager.getInstance();
    }

    static getInstance(): EncryptionService {
        if (!EncryptionService.instance) {
            EncryptionService.instance = new EncryptionService();
        }
        return EncryptionService.instance;
    }

    private getPersistentKeyStorageKey(userId: string): string {
        return `${this.persistentKeyStoragePrefix}${userId}`;
    }

    private bytesToBase64(bytes: Uint8Array): string {
        let binary = "";
        const chunkSize = 0x8000;
        for (let offset = 0; offset < bytes.length; offset += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
        }
        return btoa(binary);
    }

    private base64ToBytes(value: string): Uint8Array {
        const binary = atob(value);
        return Uint8Array.from(binary, (character) => character.charCodeAt(0));
    }

    private hexToBytes(value: string): Uint8Array {
        if (!/^[0-9a-f]+$/i.test(value) || value.length % 2 !== 0) {
            throw new Error("Invalid encryption key material");
        }
        return Uint8Array.from(value.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16));
    }

    private concatBytes(...parts: Uint8Array[]): Uint8Array {
        const result = new Uint8Array(parts.reduce((length, part) => length + part.length, 0));
        let offset = 0;
        for (const part of parts) {
            result.set(part, offset);
            offset += part.length;
        }
        return result;
    }

    private wordArrayToBytes(wordArray: CryptoJS.lib.WordArray): Uint8Array {
        const result = new Uint8Array(wordArray.sigBytes);
        for (let index = 0; index < wordArray.sigBytes; index += 1) {
            result[index] = (wordArray.words[index >>> 2] >>> (24 - (index % 4) * 8)) & 0xff;
        }
        return result;
    }

    private parseStoredKey(rawStoredKey: string | null, expectedUserId: string): StoredUserKey | null {
        if (!rawStoredKey) return null;

        try {
            const parsed = JSON.parse(rawStoredKey) as Partial<StoredUserKey>;
            if (
                !parsed ||
                parsed.userId !== expectedUserId ||
                typeof parsed.expiresAt !== "number" ||
                parsed.expiresAt <= Date.now()
            ) {
                return null;
            }

            if ("version" in parsed && parsed.version === 2) {
                return typeof parsed.encryptedKey === "string" && typeof parsed.iv === "string"
                    ? parsed as WrappedStoredUserKey
                    : null;
            }
            return "key" in parsed && typeof parsed.key === "string"
                ? parsed as LegacyStoredUserKey
                : null;
        } catch {
            return null;
        }
    }

    private openKeyDatabase(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.keyDatabaseName, 1);
            request.onupgradeneeded = () => {
                if (!request.result.objectStoreNames.contains(this.keyDatabaseStore)) {
                    request.result.createObjectStore(this.keyDatabaseStore);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error ?? new Error("Secure key storage unavailable"));
        });
    }

    private async getDeviceWrappingKey(): Promise<CryptoKey> {
        const database = await this.openKeyDatabase();
        try {
            const existing = await new Promise<CryptoKey | undefined>((resolve, reject) => {
                const request = database.transaction(this.keyDatabaseStore, "readonly")
                    .objectStore(this.keyDatabaseStore)
                    .get(this.deviceKeyId);
                request.onsuccess = () => resolve(request.result as CryptoKey | undefined);
                request.onerror = () => reject(request.error);
            });
            if (existing) return existing;

            const key = await crypto.subtle.generateKey(
                { name: "AES-GCM", length: 256 },
                false,
                ["encrypt", "decrypt"],
            );
            await new Promise<void>((resolve, reject) => {
                const request = database.transaction(this.keyDatabaseStore, "readwrite")
                    .objectStore(this.keyDatabaseStore)
                    .put(key, this.deviceKeyId);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
            return key;
        } finally {
            database.close();
        }
    }

    private async wrapCurrentKey(userId: string, expiresAt: number): Promise<WrappedStoredUserKey> {
        if (!this.userKey) throw new Error("Encryption key not initialized");

        const wrappingKey = await this.getDeviceWrappingKey();
        const iv = crypto.getRandomValues(new Uint8Array(GCM_IV_LENGTH));
        const additionalData = new TextEncoder().encode(`absendo:key:${userId}`);
        const encrypted = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv, additionalData },
            wrappingKey,
            new TextEncoder().encode(this.userKey),
        );
        return {
            version: 2,
            userId,
            encryptedKey: this.bytesToBase64(new Uint8Array(encrypted)),
            iv: this.bytesToBase64(iv),
            expiresAt,
        };
    }

    private async unwrapStoredKey(storedKey: WrappedStoredUserKey): Promise<string> {
        const wrappingKey = await this.getDeviceWrappingKey();
        const additionalData = new TextEncoder().encode(`absendo:key:${storedKey.userId}`);
        const decrypted = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: this.base64ToBytes(storedKey.iv),
                additionalData,
            },
            wrappingKey,
            this.base64ToBytes(storedKey.encryptedKey),
        );
        return new TextDecoder().decode(decrypted);
    }

    async storeCurrentKey(userId: string, rememberDevice = true): Promise<boolean> {
        if (!this.userKey) return false;

        this.currentUserId = userId;
        try {
            await this.persistWrappedKey(userId, Date.now() + this.persistentKeyTtlMs, rememberDevice);
        } catch (error) {
            // No IndexedDB/WebCrypto storage (e.g. strict private mode): keep the key in memory, ask for the PIN after reload.
            console.warn("Encryption key could not be stored on this device:", error);
        }
        return true;
    }

    private async persistWrappedKey(userId: string, expiresAt: number, rememberDevice: boolean): Promise<void> {
        const boundedExpiry = Math.min(expiresAt, Date.now() + this.persistentKeyTtlMs);
        const storedKey = await this.wrapCurrentKey(userId, boundedExpiry);
        const serialized = JSON.stringify(storedKey);
        sessionStorage.setItem(this.sessionKeyStorageKey, serialized);

        const persistentKeyStorageKey = this.getPersistentKeyStorageKey(userId);
        if (rememberDevice) localStorage.setItem(persistentKeyStorageKey, serialized);
        else localStorage.removeItem(persistentKeyStorageKey);
    }

    async restoreKeyForUser(userId: string): Promise<boolean> {
        const persistentStorageKey = this.getPersistentKeyStorageKey(userId);
        const sessionStoredKey = this.parseStoredKey(sessionStorage.getItem(this.sessionKeyStorageKey), userId);
        const persistentStoredKey = this.parseStoredKey(localStorage.getItem(persistentStorageKey), userId);
        const candidates = [
            {
                storedKey: sessionStoredKey,
                rememberDevice: persistentStoredKey !== null,
                expiresAt: persistentStoredKey?.expiresAt ?? sessionStoredKey?.expiresAt,
            },
            { storedKey: persistentStoredKey, rememberDevice: true, expiresAt: persistentStoredKey?.expiresAt },
        ];

        for (const candidate of candidates) {
            const storedKey = candidate.storedKey;
            if (!storedKey) continue;
            try {
                this.userKey = "version" in storedKey
                    ? await this.unwrapStoredKey(storedKey)
                    : storedKey.key;
                this.currentUserId = userId;
                await this.persistWrappedKey(
                    userId,
                    candidate.expiresAt ?? storedKey.expiresAt,
                    candidate.rememberDevice,
                );
                return true;
            } catch {
                this.userKey = null;
                this.currentUserId = null;
            }
        }

        sessionStorage.removeItem(this.sessionKeyStorageKey);
        localStorage.removeItem(persistentStorageKey);
        return false;
    }

    async initializeKeyForOAuthWithPin(userId: string, userEmail: string, pin: string): Promise<void> {
        this.currentUserId = userId;
        const userSalt = await this.saltManager.getSaltForUser(userId);
        this.userKey = CryptoJS.PBKDF2(userId + userEmail + pin, userSalt, {
            keySize: 256 / 32,
            iterations: 10000,
            hasher: CryptoJS.algo.SHA512,
        }).toString();

        const pinHash = CryptoJS.SHA256(this.userKey).toString();
        const { error } = await supabase.from("profiles")
            .update({ pin_hash: pinHash, has_pin: true })
            .eq("id", userId);
        if (error) {
            this.userKey = null;
            this.currentUserId = null;
            throw new Error(`Failed to save PIN hash: ${error.message}`);
        }
    }

    async revertPinSetup(userId: string): Promise<void> {
        await this.clearKey();
        const { error } = await supabase.from("profiles")
            .update({ pin_hash: null, has_pin: false })
            .eq("id", userId);
        if (error) throw new Error(`Failed to revert PIN setup: ${error.message}`);
    }

    async verifyPin(userId: string, userEmail: string, pin: string): Promise<boolean> {
        try {
            const { data: profileData, error } = await supabase.from("profiles")
                .select("pin_hash")
                .eq("id", userId)
                .single();
            if (error || !profileData) return false;

            const userSalt = await this.saltManager.getSaltForUser(userId);
            const userKey = CryptoJS.PBKDF2(userId + userEmail + pin, userSalt, {
                keySize: 256 / 32,
                iterations: 10000,
                hasher: CryptoJS.algo.SHA512,
            }).toString();
            if (CryptoJS.SHA256(userKey).toString() !== profileData.pin_hash) return false;

            this.userKey = userKey;
            this.currentUserId = userId;
            return true;
        } catch {
            return false;
        }
    }

    async clearKey(): Promise<void> {
        this.userKey = null;
        sessionStorage.removeItem(this.sessionKeyStorageKey);
        sessionStorage.removeItem("userPin");
        sessionStorage.removeItem("userKey");
        if (this.currentUserId) {
            this.saltManager.clearSaltForUser(this.currentUserId);
            localStorage.removeItem(this.getPersistentKeyStorageKey(this.currentUserId));
        }
        this.currentUserId = null;
    }

    isInitialized(): boolean {
        return this.userKey !== null;
    }

    isInitializedForUser(userId: string): boolean {
        return this.userKey !== null && this.currentUserId === userId;
    }

    isLegacyCiphertext(value: unknown): value is string {
        return typeof value === "string" && value.length > 0 && !value.startsWith(TEXT_CIPHERTEXT_PREFIX);
    }

    private async deriveV2DataKey(salt: string): Promise<CryptoKey> {
        if (!this.userKey) throw new Error("Encryption key not initialized");
        const material = await crypto.subtle.importKey(
            "raw",
            this.hexToBytes(this.userKey),
            "HKDF",
            false,
            ["deriveKey"],
        );
        return crypto.subtle.deriveKey(
            {
                name: "HKDF",
                hash: "SHA-256",
                salt: this.hexToBytes(salt),
                info: new TextEncoder().encode("absendo:v2:data-encryption"),
            },
            material,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"],
        );
    }

    async encrypt(data: Record<string, unknown>, userId: string): Promise<EncryptionResult> {
        if (!this.userKey) throw new Error("Encryption key not initialized");

        const salt = await this.saltManager.getSaltForUser(userId);
        const key = await this.deriveV2DataKey(salt);
        const iv = crypto.getRandomValues(new Uint8Array(GCM_IV_LENGTH));
        const encrypted = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv,
                additionalData: new TextEncoder().encode("absendo:v2:text"),
            },
            key,
            new TextEncoder().encode(JSON.stringify(data)),
        );
        return {
            encryptedData: `${TEXT_CIPHERTEXT_PREFIX}${this.bytesToBase64(iv)}:${this.bytesToBase64(new Uint8Array(encrypted))}`,
            salt,
        };
    }

    async decrypt(encryptedData: string, salt: string): Promise<DecryptionResult> {
        if (!this.userKey) return { success: false, error: "Encryption key not initialized" };

        try {
            if (encryptedData.startsWith(TEXT_CIPHERTEXT_PREFIX)) {
                const encoded = encryptedData.slice(TEXT_CIPHERTEXT_PREFIX.length);
                const separator = encoded.indexOf(":");
                if (separator < 1) throw new Error("Invalid encrypted data envelope");
                const key = await this.deriveV2DataKey(salt);
                const decrypted = await crypto.subtle.decrypt(
                    {
                        name: "AES-GCM",
                        iv: this.base64ToBytes(encoded.slice(0, separator)),
                        additionalData: new TextEncoder().encode("absendo:v2:text"),
                    },
                    key,
                    this.base64ToBytes(encoded.slice(separator + 1)),
                );
                return {
                    success: true,
                    data: JSON.parse(new TextDecoder().decode(decrypted)) as Record<string, unknown>,
                };
            }

            const legacyKey = CryptoJS.PBKDF2(this.userKey, salt, {
                keySize: 256 / 32,
                iterations: 1000,
            });
            const decryptedData = CryptoJS.AES.decrypt(encryptedData, legacyKey.toString())
                .toString(CryptoJS.enc.Utf8);
            if (!decryptedData) throw new Error("Invalid key or corrupted encrypted data");
            return { success: true, data: JSON.parse(decryptedData) as Record<string, unknown> };
        } catch (error) {
            return {
                success: false,
                error: `Decryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    // Returns null instead of throwing: one unreadable row (e.g. old NULL pdf_name) must not hide the whole list.
    async decryptField(encryptedField: string | null, userId: string): Promise<string | null> {
        if (!encryptedField) return null;
        const salt = await this.saltManager.getSaltForUser(userId);
        const result = await this.decrypt(encryptedField, salt);
        if (!result.success || !result.data) {
            console.error("Field decryption failed:", result.error);
            return null;
        }
        const values = Object.values(result.data);
        if (values.length !== 1) return null;
        const value = values[0];
        return value === null || value === undefined ? null : String(value);
    }

    async encryptProfileData(profileData: Record<string, unknown>): Promise<Record<string, unknown>> {
        if (!this.isInitialized()) throw new Error("Encryption key not initialized");
        if (typeof profileData.id !== "string" || !profileData.id) throw new Error("Profile user ID missing");

        const sensitiveData: Record<string, unknown> = {};
        const nonSensitiveData: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(profileData)) {
            if (SENSITIVE_PROFILE_FIELDS.includes(key as typeof SENSITIVE_PROFILE_FIELDS[number])) {
                sensitiveData[key] = value;
            } else if (key !== "encrypted_data" && key !== "encryption_salt" && key !== "is_encrypted") {
                nonSensitiveData[key] = value;
            }
        }

        const encryptionResult = await this.encrypt(sensitiveData, profileData.id);
        return {
            ...nonSensitiveData,
            ...Object.fromEntries(SENSITIVE_PROFILE_FIELDS.map((field) => [field, null])),
            encrypted_data: encryptionResult.encryptedData,
            encryption_salt: encryptionResult.salt,
            is_encrypted: true,
            id: profileData.id,
        };
    }

    async decryptProfileData(profileData: Record<string, unknown>): Promise<Record<string, unknown>> {
        if (!profileData.is_encrypted) return profileData;
        if (!this.isInitialized()) throw new Error("Encryption key not initialized");

        const result = await this.decrypt(
            String(profileData.encrypted_data ?? ""),
            String(profileData.encryption_salt ?? ""),
        );
        if (!result.success || !result.data) throw new Error(result.error ?? "Profile decryption failed");

        const nonSensitiveData: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(profileData)) {
            if (
                key !== "encrypted_data" &&
                key !== "encryption_salt" &&
                key !== "is_encrypted" &&
                !SENSITIVE_PROFILE_FIELDS.includes(key as typeof SENSITIVE_PROFILE_FIELDS[number])
            ) {
                nonSensitiveData[key] = value;
            }
        }
        return { ...nonSensitiveData, ...result.data };
    }

    profileNeedsMigration(profileData: Record<string, unknown>): boolean {
        return (
            !profileData.is_encrypted ||
            this.isLegacyCiphertext(profileData.encrypted_data) ||
            SENSITIVE_PROFILE_FIELDS.some((field) => profileData[field] !== null && profileData[field] !== undefined)
        );
    }

    async migratePdfMetadataIfNeeded(
        original: PdfMetadataRecord,
        decrypted: PdfMetadataRecord,
        userId: string,
    ): Promise<void> {
        const fields = ["file_path", "date_of_absence", "reason", "pdf_name"] as const;
        if (!fields.some((field) => this.isLegacyCiphertext(original[field]))) return;
        // Never overwrite a field we could not decrypt.
        if (fields.some((field) => original[field] && !decrypted[field])) return;

        const jsonKeys = {
            file_path: "filePath",
            date_of_absence: "dateOfAbsence",
            reason: "reason",
            pdf_name: "pdfName",
        } as const;
        const encrypted = await Promise.all(fields.map((field) =>
            this.encrypt({ [jsonKeys[field]]: decrypted[field] }, userId),
        ));
        const update = Object.fromEntries(fields.map((field, index) => [field, encrypted[index].encryptedData]));
        const { error } = await supabase.from("pdf_files")
            .update(update)
            .eq("id", original.id)
            .eq("user_id", userId);
        if (error) throw error;
    }

    async isLegacyEncryptedBlob(blob: Blob): Promise<boolean> {
        const header = new Uint8Array(await blob.slice(0, BLOB_MAGIC.length).arrayBuffer());
        return header.length !== BLOB_MAGIC.length || header.some((byte, index) => byte !== BLOB_MAGIC[index]);
    }

    async encryptBlob(pdfBlob: Blob, userId: string): Promise<Blob> {
        if (!this.userKey) throw new Error("Encryption key not initialized");
        const salt = await this.saltManager.getSaltForUser(userId);
        const key = await this.deriveV2DataKey(salt);
        const iv = crypto.getRandomValues(new Uint8Array(GCM_IV_LENGTH));
        const encrypted = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv,
                additionalData: new TextEncoder().encode("absendo:v2:pdf"),
            },
            key,
            await pdfBlob.arrayBuffer(),
        );
        return new Blob(
            [this.concatBytes(BLOB_MAGIC, iv, new Uint8Array(encrypted))],
            { type: "application/octet-stream" },
        );
    }

    async decryptBlob(encryptedBlob: Blob, userId: string): Promise<Blob> {
        if (!this.userKey) throw new Error("Encryption key not initialized");
        const bytes = new Uint8Array(await encryptedBlob.arrayBuffer());
        const salt = await this.saltManager.getSaltForUser(userId);
        let decryptedBytes: Uint8Array;

        if (!(await this.isLegacyEncryptedBlob(encryptedBlob))) {
            const key = await this.deriveV2DataKey(salt);
            const iv = bytes.slice(BLOB_MAGIC.length, BLOB_MAGIC.length + GCM_IV_LENGTH);
            const ciphertext = bytes.slice(BLOB_MAGIC.length + GCM_IV_LENGTH);
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv,
                    additionalData: new TextEncoder().encode("absendo:v2:pdf"),
                },
                key,
                ciphertext,
            );
            decryptedBytes = new Uint8Array(decrypted);
        } else {
            const legacyKey = CryptoJS.PBKDF2(this.userKey, salt, {
                keySize: 256 / 32,
                iterations: 1000,
            });
            const decrypted = CryptoJS.AES.decrypt(
                CryptoJS.lib.CipherParams.create({ ciphertext: CryptoJS.lib.WordArray.create(bytes) }),
                legacyKey,
                { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 },
            );
            decryptedBytes = this.wordArrayToBytes(decrypted);
        }

        if (new TextDecoder().decode(decryptedBytes.slice(0, 5)) !== "%PDF-") {
            throw new Error("Decrypted file is not a valid PDF");
        }
        return new Blob([decryptedBytes], { type: "application/pdf" });
    }

    async isPinBasedAuthReady(userId: string): Promise<boolean> {
        const { data, error } = await supabase.from("profiles")
            .select("has_pin")
            .eq("id", userId)
            .single();
        if (error) throw error;
        return data?.has_pin ?? false;
    }
}

export default EncryptionService;
