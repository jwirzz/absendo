import ical from 'ical';
import fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import {supabase} from "../supabaseClient.ts";
import teachersData from '../data/teachers24-25-bbzw.json';
import subjectsData from '../data/subjects24-25-bbzw.json';
import EncryptionService from './encryptionService.ts';

export async function generatePdf(userData, form_data) {
    return  await getPdfData(userData, form_data);
}

export async function getAbsenceOptions(userData, dateValue) {
    if (!userData?.calendar_url || !dateValue) {
        return [];
    }

    const events = await getICALData(userData.calendar_url);
    const date = new Date(dateValue);
    const processedEvents = processEvents(events, date);

    return processedEvents.map((event) => ({
        ...event,
        key: buildEventKey(event),
    }));
}

async function getPdfData(userData, form_data) {
    const url = userData.calendar_url;
    const events = await getICALData(url);
    const date = new Date(form_data.date);
    getWeekday(date);
    const processedEvents = processEvents(events, date);
    const selectedLessonKeys = Array.isArray(form_data.selectedLessonKeys) ? form_data.selectedLessonKeys : [];
    const selectedEvents = selectedLessonKeys.length > 0
        ? processedEvents.filter((event) => selectedLessonKeys.includes(buildEventKey(event)))
        : processedEvents;

    if (processedEvents.length === 0) {
        const formattedDate = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        throw new Error(`Absendo findet keine Daten am ${formattedDate}`);
    }

    if (selectedEvents.length === 0) {
        throw new Error('Bitte wähle mindestens eine Lektion aus');
    }

    const pdfForm = await fillForm(userData, selectedEvents, form_data);
    const pdfBlob = new Blob([pdfForm], { type: 'application/pdf' });
    if(!form_data.isDoNotSaveEnabled) {
        await savePdfInDB(pdfBlob, userData.id, form_data.fileName, date, form_data.reason);
    }
    return pdfBlob
}


async function getUserData(user_id) {
    const {data} = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user_id)
        .single();
    const encryptionService = EncryptionService.getInstance();
    const decryptedData = encryptionService.decryptProfileData(data);
    
    return decryptedData;
}

async function getICALData(url) {
    try {
        const response = await fetch(`https://api.absendo.app/proxy?url=${url}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.text();

        return ical.parseICS(data);

    } catch (error) {
        throw new Error(`Failed to fetch iCal data: ${error.message}`);
    }
}

function getWeekday(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}

function filterEventsByDate(events, filterDatum) {
    const array = [];
    for (const k in events) {
        if (events[k].type === 'VEVENT') {
            const date = new Date(events[k].start);
            if (
                date.getDate() === filterDatum.getDate() &&
                date.getMonth() === filterDatum.getMonth() &&
                date.getFullYear() === filterDatum.getFullYear()
            ) {
                if (shouldSkipByMissingLocation(events[k])) {
                    continue;
                }

                const title = events[k].summary || '';
                if (shouldSkipByTeacherField(title)) {
                    continue;
                }

                const parsed = parseLessonSummary(title);

                if (isAssessmentEvent(title, parsed.fach)) {
                    continue;
                }

                const object = {
                    datum: getFormattedDate(filterDatum),
                    fach: parsed.fach,
                    lehrer: parsed.lehrer,
                    klasse: parsed.klasse,
                };
                array.push(object);
            }
        }
    }
    return array;
}


function getFormattedDate(date) {
    const options = { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' };
    const formattedDate = date.toLocaleDateString('de-CH', options).replace(',', '');
    const [weekday, dayMonthYear] = formattedDate.split(' ');
    const [day, month, year] = dayMonthYear.split('.');
    const formattedWeekday = weekday.replace('.', '');

    return `${formattedWeekday}, ${day}.${month}.${year}`;
}

function cleanToken(token) {
    return token.replace(/[(),.;:]/g, '').trim();
}

function hasSpace(str) {
    return /\s/.test((str || '').trim());
}

function shouldSkipByTeacherField(title) {
    if (!title || typeof title !== 'string') {
        return true;
    }

    const teacherPart = (title.split('-').pop() || '').trim();
    if (!teacherPart) {
        return true;
    }

    // Gleich wie früher: Einträge mit Leerzeichen im Lehrer-Feld verwerfen.
    return hasSpace(teacherPart);
}

function getEventLocation(event) {
    if (!event) return '';
    if (typeof event.location === 'string') return event.location.trim();
    if (event.location && typeof event.location.val === 'string') return event.location.val.trim();
    return '';
}

function shouldSkipByMissingLocation(event) {
    // In eurem Kalender: Tests/Prüfungen haben keinen Ort.
    return getEventLocation(event) === '';
}

function normalizeTeacherToken(token) {
    if (!token) return '';
    const cleaned = cleanToken(token);
    if (!cleaned) return '';

    if (teachersData[cleaned]) {
        return cleaned;
    }

    const titleCase = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    if (teachersData[titleCase]) {
        return titleCase;
    }

    return '';
}

function normalizeForMatch(text) {
    return (text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function isAssessmentEvent(title, fach) {
    const normalizedTitle = normalizeForMatch(title);
    const subjectName = getSubjectName(fach);
    const normalizedSubjectName = normalizeForMatch(subjectName);

    const keywordPatterns = [
        'prufung',
        'schlussprufung',
        'aufnahmeprufung',
        'zertifikat',
        'test',
        'tests',
        'assessment',
        'quiz',
        'standort',
        'probe',
        'exam',
    ];

    if (keywordPatterns.some((keyword) => normalizedTitle.includes(keyword) || normalizedSubjectName.includes(keyword))) {
        return true;
    }

    const firstPart = (title || '').split('-')[0]?.trim() || '';
    const firstPartTokens = firstPart
        .split(/\s+/)
        .map((token) => token.trim().toUpperCase())
        .filter(Boolean);

    if (firstPartTokens.length > 1) {
        const markerTokens = new Set(['SP', 'MP', 'ZP', 'AP', 'TEST']);
        if (firstPartTokens.some((token) => markerTokens.has(token))) {
            return true;
        }
    }

    return false;
}

function isClassLikeToken(token) {
    return /[A-Z]-[A-Z]+\d{2}[a-zA-Z]+(?:-LO)?/.test(token) || /^[SWER]$/.test(token) || /\d/.test(token);
}

function parseLessonSummary(title) {
    const fallback = {
        fach: 'Unbekannt',
        lehrer: 'Unbekannt',
        klasse: '',
    };

    if (!title || typeof title !== 'string') {
        return fallback;
    }

    const classe = extractClasse(title);
    const parts = title
        .split('-')
        .map((part) => part.trim())
        .filter(Boolean);

    const fach = parts[0] || fallback.fach;
    const classTokens = new Set(
        (classe || '')
            .split(/[,\s-]+/)
            .map((token) => token.trim())
            .filter(Boolean)
    );

    const teacherCandidates = [];
    for (const part of parts) {
        const tokens = part.split(/\s+/).map((token) => cleanToken(token)).filter(Boolean);
        teacherCandidates.push(...tokens);
    }

    let teacher = '';
    for (const candidate of teacherCandidates) {
        const normalized = normalizeTeacherToken(candidate);
        if (normalized) {
            teacher = normalized;
            break;
        }
    }

    if (!teacher) {
        const fallbackTeacher = teacherCandidates.find((candidate) => {
            if (!candidate) return false;
            if (candidate === fach) return false;
            if (classTokens.has(candidate)) return false;
            if (isClassLikeToken(candidate)) return false;
            return /^[A-Za-zÄÖÜäöü]{2,5}$/.test(candidate);
        });

        teacher = fallbackTeacher || fallback.lehrer;
    }

    return {
        fach,
        lehrer: teacher,
        klasse: classe,
    };
}

function removeDuplicatesWithCount(array) {
    const countMap = new Map();

    array.forEach(item => {
        const key = JSON.stringify(item);
        if (countMap.has(key)) {
            countMap.set(key, countMap.get(key) + 1);
        } else {
            countMap.set(key, 1);
        }
    });

    const result = [];
    countMap.forEach((count, key) => {
        const item = JSON.parse(key);
        item.count = count;
        result.push(item);
    });

    return result;
}

function processEvents(events, filterDatum) {
    const filteredEvents = filterEventsByDate(events, filterDatum);
    return removeDuplicatesWithCount(filteredEvents);
}

function buildEventKey(event) {
    return `${event.datum}|${event.fach}|${event.lehrer}|${event.klasse}`;
}

// To check the fields in the PDF
async function processPDF() {
    const formBytes = fs.readFileSync('Entschuldigung_Urlaubsgesuch_V2023_08_11.pdf');
    const pdfDoc = await PDFDocument.load(formBytes);
    const form = pdfDoc.getForm();
    form.getFields().forEach(f => {
        console.log(`${f.getName()} (${f.constructor.name})`);
    });
}

function formatBirthday(birthday) {
    const date = new Date(birthday);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
}

function getTeacherName(shortname) {
    return teachersData[shortname] || shortname;
}

function getSubjectName(shortSubjectName) {
    return subjectsData[shortSubjectName] || shortSubjectName;
}


async function fillForm(userData, processedEvents, form_data) {
    const date = new Date(form_data.date);
    const response = await fetch('/templates/Entschuldigung_Urlaubsgesuch_V2023_08_11.pdf');
    const formBytes = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(formBytes);
    const form = pdfDoc.getForm();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const formattedDate = `${day}.${month}.${year}`;

    form.getTextField('Name und Vorname Lernender').setText(userData.last_name + ' ' + userData.first_name);
    form.getTextField('Geburtsdatum').setText(formatBirthday(userData.birthday));
    form.getTextField('Klasse').setText(processedEvents[0].klasse);
    form.getTextField('Datum der Absenz').setText(formattedDate);
    form.getTextField('Begründung der Absenzen Beim Urlaubsgesuch Beweismittel zwingend beilegen').setText(form_data.reason);

    form.getTextField('Name und Telefonnummer Berufsbildnerin').setText(userData.last_name_trainer + ' ' + userData.first_name_trainer + ' ' + userData.phone_number_trainer);
    form.getTextField('E-Mailadresse Berufsbildner/in').setText(userData.email_trainer);

    if(form_data.is_excused === true) {
        form.getCheckBox('undefined').check();
    }else {
        form.getCheckBox('undefined_2').check();
    }

    if (processedEvents.length > 0 && processedEvents.length <= 7) {
        for (let i = 0; i < processedEvents.length; i++) {
            const event = processedEvents[i];
            if(form_data.isFullNameEnabled === true) {
                event.lehrer = getTeacherName(event.lehrer);
            }
            if(form_data.isFullSubjectEnabled === true) {
                event.fach = getSubjectName(event.fach);
            }  

            form.getTextField(`Anzahl LektionenRow${i + 1}`).setText(event.count.toString());
            form.getTextField(`Wochentag und Da tumRow${i + 1}`).setText(event.datum);
            form.getTextField(`FachRow${i + 1}`).setText(event.fach);
            form.getTextField(`LehrpersonRow${i + 1}`).setText(event.lehrer);
        }
    }

    return await pdfDoc.save();
}

async function savePdfInDB(pdfForm, userId, fileName, dateOfAbsence, reason) {
    if (!(await checkUserIdExists(userId))) return;

    const filePathBase = `${userId}/forms/`;
    const extensionIndex = fileName.lastIndexOf('.');
    const baseName = extensionIndex !== -1 ? fileName.substring(0, extensionIndex) : fileName;
    const extension = extensionIndex !== -1 ? fileName.substring(extensionIndex) : '';

    const { data: files, error } = await supabase.storage
        .from('pdf-files')
        .list(filePathBase);

    if (error) {
        console.error("Fehler beim Abrufen der Dateien:", error);
        return;
    }

    const existingNames = new Set(files.map(f => f.name));

    let counter = 0;
    let uniqueFileName;
    while (true) {
        uniqueFileName = counter === 0
            ? `${baseName}${extension}`
            : `${baseName} (${counter})${extension}`;

        if (!existingNames.has(uniqueFileName)) break;
        counter++;
    }

    const filePath = `${filePathBase}${uniqueFileName}`;
    const encryptionService = EncryptionService.getInstance();
    const encryptedFilePath = await encryptionService.encrypt({filePath: filePath}, userId);
    const encryptedDateOfAbsence = await encryptionService.encrypt({dateOfAbsence: dateOfAbsence}, userId);
    const encryptedReason = await encryptionService.encrypt({reason: reason}, userId);
    const encryptedPdfName = await encryptionService.encrypt({pdfName: fileName}, userId);

    const pdf = await encryptionService.encryptBlob(pdfForm, userId)
    const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('pdf-files')
        .upload(filePath, pdf, {
            metadata: {
                dateOfAbsence: dateOfAbsence
            }
        });

    const { error: dbError } = await supabase
        .from('pdf_files')
        .insert({
            user_id: userId,
            file_path: encryptedFilePath.encryptedData,
            date_of_absence: encryptedDateOfAbsence.encryptedData,
            reason: encryptedReason.encryptedData,
            pdf_name: encryptedPdfName.encryptedData,
        })

    if (dbError) {
        console.error('Fehler beim Speichern der Metadaten:', dbError)
    }

    if (uploadError) {
        console.error("Fehler beim Hochladen:", uploadError);
    }
}



async function checkUserIdExists(userId) {
    const { error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

    return !error;

}
function extractClasse(title) {
        const matches = title.match(/[SWER]-[A-Z]+\d{2}[a-zA-Z]+(?:-LO)?/g);
        return matches ? matches.join(',') : '';
}
