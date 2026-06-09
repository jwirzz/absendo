import CryptoJS from 'crypto-js';
import SaltManager from './saltManager';
import {supabase} from "../supabaseClient.ts";

interface EncryptionResult {
    encryptedData: string;
    salt: string;
}

interface DecryptionResult {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
}

interface StoredUserKey {
    userId: string;
    key: string;
    expiresAt: number;
}

class EncryptionService {
    private static instance: EncryptionService;
    private userKey: string | null = null;
    saltManager: SaltManager;
    private currentUserId: string | null = null;
    private readonly sessionKeyStorageKey = "absendo_session_user_key";
    private readonly persistentKeyStoragePrefix = "absendo_persistent_user_key:";
    private readonly persistentKeyTtlMs = 90 * 24 * 60 * 60 * 1000;
    private readonly persistentKeyExtensionMs = 10 * 24 * 60 * 60 * 1000;

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

    private parseStoredKey(rawStoredKey: string | null, expectedUserId: string): StoredUserKey | null {
        if (!rawStoredKey) {
            return null;
        }

        try {
            const parsed = JSON.parse(rawStoredKey) as StoredUserKey;
            if (
                parsed &&
                parsed.userId === expectedUserId &&
                typeof parsed.key === "string" &&
                typeof parsed.expiresAt === "number" &&
                parsed.expiresAt > Date.now()
            ) {
                return parsed;
            }
        } catch {
            return null;
        }

        return null;
    }

    private buildStoredUserKey(userId: string): StoredUserKey | null {
        if (!this.userKey) {
            return null;
        }

        return {
            userId,
            key: this.userKey,
            expiresAt: Date.now() + this.persistentKeyTtlMs
        };
    }

    private extendStoredKeyValidity(storedKey: StoredUserKey): StoredUserKey {
        const base = Math.max(storedKey.expiresAt, Date.now());
        return {
            ...storedKey,
            expiresAt: base + this.persistentKeyExtensionMs
        };
    }

    storeCurrentKey(userId: string, rememberDevice = true): boolean {
        const storedKey = this.buildStoredUserKey(userId);
        if (!storedKey) {
            return false;
        }

        this.currentUserId = userId;
        const serialized = JSON.stringify(storedKey);
        sessionStorage.setItem(this.sessionKeyStorageKey, serialized);

        const persistentKeyStorageKey = this.getPersistentKeyStorageKey(userId);
        if (rememberDevice) {
            localStorage.setItem(persistentKeyStorageKey, serialized);
        } else {
            localStorage.removeItem(persistentKeyStorageKey);
        }

        return true;
    }

    restoreKeyForUser(userId: string): boolean {
        const sessionStoredKey = this.parseStoredKey(
            sessionStorage.getItem(this.sessionKeyStorageKey),
            userId
        );

        if (sessionStoredKey) {
            this.userKey = sessionStoredKey.key;
            this.currentUserId = userId;
            return true;
        }

        const persistentStorageKey = this.getPersistentKeyStorageKey(userId);
        const persistentStoredKey = this.parseStoredKey(
            localStorage.getItem(persistentStorageKey),
            userId
        );

        if (persistentStoredKey) {
            this.userKey = persistentStoredKey.key;
            this.currentUserId = userId;
            const extendedStoredKey = this.extendStoredKeyValidity(persistentStoredKey);
            const serializedExtendedKey = JSON.stringify(extendedStoredKey);
            sessionStorage.setItem(this.sessionKeyStorageKey, serializedExtendedKey);
            localStorage.setItem(persistentStorageKey, serializedExtendedKey);
            return true;
        }

        sessionStorage.removeItem(this.sessionKeyStorageKey);
        localStorage.removeItem(persistentStorageKey);
        return false;
    }

    async initializeKeyForOAuthWithPin(userId: string, userEmail: string, pin: string): Promise<void> {
        this.currentUserId = userId;
        const userSalt = await this.saltManager.getSaltForUser(userId);

        const keyMaterial = userId + userEmail + pin;
        this.userKey = CryptoJS.PBKDF2(keyMaterial, userSalt, {
            keySize: 256 / 32,
            iterations: 10000,
            hasher: CryptoJS.algo.SHA512
        }).toString();

        const pinHash = CryptoJS.SHA256(this.userKey).toString();

        const { error } = await supabase
            .from('profiles')
            .update({ pin_hash: pinHash, has_pin: true })
            .eq('id', userId);

        if (error) {
            this.userKey = null;
            this.currentUserId = null;
            throw new Error(`Failed to save PIN hash: ${error.message}`);
        }
    }

    async revertPinSetup(userId: string): Promise<void> {
        console.warn(`Reverting PIN setup for user ${userId} due to a downstream error.`);
        await this.clearKey();
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ pin_hash: null, has_pin: false })
                .eq('id', userId);
            
            if (error) {
                console.error(`Failed to revert PIN setup in database: ${error.message}`);
            }
        } catch (dbError) {
            console.error(`An unexpected error occurred while reverting PIN setup: ${dbError}`);
        }
    }


    async verifyPin(userId: string, userEmail: string, pin: string): Promise<boolean> {
        try {
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('pin_hash')
                .eq('id', userId)
                .single();

            if (error || !profileData) {
                console.error('Error fetching pin hash:', error);
                return false;
            }

            const userSalt = await this.saltManager.getSaltForUser(userId);
            const keyMaterial = userId + userEmail + pin;
            const userKey = CryptoJS.PBKDF2(keyMaterial, userSalt, {
                keySize: 256 / 32,
                iterations: 10000,
                hasher: CryptoJS.algo.SHA512
            }).toString();

            const pinHash = CryptoJS.SHA256(userKey).toString();

            if (pinHash === profileData.pin_hash) {
                this.userKey = userKey;
                this.currentUserId = userId;
                return true;
            }

            return false;
        } catch (error) {
            console.error('PIN verification failed:', error);
            return false;
        }
    }

    async clearKey(): Promise<void> {
        this.userKey = null;
        sessionStorage.removeItem(this.sessionKeyStorageKey);

        if (this.currentUserId) {
            await this.saltManager.clearSaltForUser(this.currentUserId);
            localStorage.removeItem(this.getPersistentKeyStorageKey(this.currentUserId));
        }

        sessionStorage.removeItem("userPin");

        const savedKey = sessionStorage.getItem("userKey");
        if(savedKey) {
            sessionStorage.removeItem("userKey");
        }

        this.currentUserId = null;
    }

    isInitialized(): boolean {
        return this.userKey !== null;
    }

    async encrypt(data: Record<string, unknown>, userId: string): Promise<EncryptionResult | null> {
        if (!this.userKey) {
            console.error('Encryption key not initialized');
            return null;
        }

        try {
            const dataString = JSON.stringify(data);
            const salt = await this.saltManager.getSaltForUser(userId);
            const key = CryptoJS.PBKDF2(this.userKey, salt, {
                keySize: 256 / 32,
                iterations: 1000
            });

            const encrypted = CryptoJS.AES.encrypt(dataString, key.toString()).toString();

            return {
                encryptedData: encrypted,
                salt: salt
            };
        } catch (error) {
            console.error('Encryption failed:', error);
            return null;
        }
    }

    decrypt(encryptedData: string, salt: string): DecryptionResult {
        if (!this.userKey) {
            return {
                success: false,
                error: 'Encryption key not initialized'
            };
        }

        try {
            const key = CryptoJS.PBKDF2(this.userKey, salt, {
                keySize: 256 / 32,
                iterations: 1000
            });

            const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, key.toString());
            const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);

            if (!decryptedData) {
                return {
                    success: false,
                    error: 'Failed to decrypt data - invalid key or corrupted data'
                };
            }

            return {
                success: true,
                data: JSON.parse(decryptedData)
            };
        } catch (error) {
            return {
                success: false,
                error: `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    async decryptField(encryptedField: string, userId: string): Promise<string | null> {
        if (!this.userKey) {
            console.error('Encryption key not initialized');
            return null;
        }
        const userSalt = await this.saltManager.getSaltForUser(userId);
        try {
            const key = CryptoJS.PBKDF2(this.userKey, userSalt, {
                keySize: 256 / 32,
                iterations: 1000
            });

            const decryptedBytes = CryptoJS.AES.decrypt(encryptedField, key.toString());
            const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);

            try {
                const parsed = JSON.parse(decryptedData);
                if (parsed && typeof parsed === 'object' && Object.keys(parsed).length === 1) {
                    return Object.values(parsed)[0] as string;
                }
            } catch {
                console.warn("Cant find any Key")
            }

            return decryptedData || null;
        } catch (error) {
            console.error('Field decryption failed:', error);
            return null;
        }
    }

    async encryptProfileData(profileData: Record<string, unknown>): Promise<Record<string, unknown>> {
        if (!this.isInitialized()) {
            console.warn('Encryption not initialized, storing data unencrypted');
            return profileData;
        }
        const sensitiveFields = [
            'first_name',
            'last_name',
            'birthday',
            'calendar_url',
            'first_name_trainer',
            'last_name_trainer',
            'phone_number_trainer',
            'email_trainer'
        ];

        const sensitiveData: Record<string, unknown> = {};
        const nonSensitiveData: Record<string, unknown> = {};

        Object.keys(profileData).forEach(key => {
            if (sensitiveFields.includes(key)) {
                sensitiveData[key] = profileData[key];
            } else {
                nonSensitiveData[key] = profileData[key];
            }
        });

        const encryptionResult = await this.encrypt(sensitiveData, profileData['id'] as string);
        if (!encryptionResult) {
            console.error('Failed to encrypt profile data');
            return profileData;
        }

        return {
            ...nonSensitiveData,
            encrypted_data: encryptionResult.encryptedData,
            encryption_salt: encryptionResult?.salt,
            is_encrypted: true,
            id: profileData['id'],
        };
    }

    decryptProfileData(profileData: Record<string, unknown>): Record<string, unknown> {
        if (!profileData.is_encrypted) {
            return profileData;
        }

        if (!this.isInitialized()) {
            console.error('Cannot decrypt data - encryption not initialized');
            return profileData;
        }

        const decryptionResult = this.decrypt(
            profileData.encrypted_data as string,
            profileData.encryption_salt as string
        );

        if (!decryptionResult.success) {
            console.error('Failed to decrypt profile data:', decryptionResult.error);
            return profileData;
        }

        const nonSensitiveData: Record<string, unknown> = {};
        for (const key in profileData) {
            if (key !== 'encrypted_data' && key !== 'encryption_salt' && key !== 'is_encrypted') {
                nonSensitiveData[key] = profileData[key];
            }
        }
        return {
            ...nonSensitiveData,
            ...(decryptionResult.data || {})
        };
    }

    async isPinBasedAuthReady(userId: string): Promise<boolean> {
        const {data} = await supabase
            .from('profiles')
            .select('has_pin')
            .eq('id', userId)
            .single();
        return data?.has_pin || false
    }

    async encryptBlob(pdfBlob: Blob, userId: string): Promise<Blob> {
        if (!this.userKey) {
            throw new Error("Encryption key not initialized");
        }

        const arrayBuffer = await pdfBlob.arrayBuffer();
        const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);

        const salt = await this.saltManager.getSaltForUser(userId);
        const key = CryptoJS.PBKDF2(this.userKey, salt, {
            keySize: 256 / 32,
            iterations: 1000
        });

        const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        });

        const encryptedWords = encrypted.ciphertext.words;
        const encryptedBlob = new Blob([
            Uint8Array.from(encryptedWords.map(w => [
                (w >> 24) & 0xff,
                (w >> 16) & 0xff,
                (w >> 8) & 0xff,
                w & 0xff
            ]).flat())
        ], { type: "application/octet-stream" });

        return encryptedBlob;
    }

    async decryptBlob(encryptedBlob: Blob, userId: string): Promise<Blob> {
        if (!this.userKey) {
            throw new Error("Encryption key not initialized");
        }

        const encryptedArrayBuffer = await encryptedBlob.arrayBuffer();
        const encryptedWordArray = CryptoJS.lib.WordArray.create(new Uint8Array(encryptedArrayBuffer));

        const salt = await this.saltManager.getSaltForUser(userId);
        const key = CryptoJS.PBKDF2(this.userKey, salt, {
            keySize: 256 / 32,
            iterations: 1000
        });

        const cipherParams = CryptoJS.lib.CipherParams.create({
            ciphertext: encryptedWordArray,
        });


        const decryptedWordArray = CryptoJS.AES.decrypt(cipherParams, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        });

        const decryptedWords = decryptedWordArray.words;
        const decryptedArrayBuffer = new Uint8Array(decryptedWords.map(w => [
            (w >> 24) & 0xff,
            (w >> 16) & 0xff,
            (w >> 8) & 0xff,
            w & 0xff
        ]).flat()).buffer;

        return new Blob([decryptedArrayBuffer], { type: "application/pdf" });
    }
}

export default EncryptionService;
