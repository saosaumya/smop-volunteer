function doPost(e) {
  var data = JSON.parse(e.postData.contents);

  if (data.type === 'clinician') {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Clinician Signups');
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Clinician Signups');
      sheet.appendRow(['Timestamp', 'Name', 'Email', 'Phone', 'Role', 'Preference', 'Shifts', 'Notes', 'IsRetired']);
    }

    var shifts = Array.isArray(data.shifts) ? data.shifts.join('\n') : String(data.shifts);

    sheet.appendRow([
      new Date(),
      data.name,
      data.email,
      data.phone || '',
      data.role || '',
      data.preference || '',
      shifts,
      data.notes || '',
      data.isRetired || false
    ]);

    var icsShifts = shifts;
    if (data.shiftsStructured && Array.isArray(data.shiftsStructured)) {
      icsShifts = data.shiftsStructured;
    }
    var icsContent = buildIcs(icsShifts, data.name, data.email, 'clinician');
    var icsBlob = Utilities.newBlob(icsContent, 'text/calendar; method=REQUEST', 'invite.ics');

    try {
      MailApp.sendEmail({
        to: data.email,
        cc: 'ssao@stanford.edu,yanethp@stanford.edu',
        subject: 'SMOP Clinician Volunteer - Sign-Up Confirmation',
        body: 'Hi ' + data.name + ',\n\n'
          + 'Thank you for signing up to volunteer with the Stanford Medicine Outreach Program!\n\n'
          + 'You signed up for:\n' + shifts + '\n\n'
          + 'TWO WAYS YOU CAN HELP:\n\n'
          + '1. SUPPORTIVE ROLE (Recommended for First-Timers)\n'
          + 'Stay in the background and support students doing blood pressure and blood sugar screenings. '
          + 'Help interpret results, answer clinical questions, and guide counseling. '
          + 'Students will come to you when they need clinical input.\n\n'
          + '2. ACTIVE MEDICAL TRIAGE\n'
          + 'In addition to supporting students, proactively do clinical outreach to patients in need of health care. '
          + 'Be willing to do basic medical assessment and clinical decision-making. '
          + 'Be willing to connect patients with primary care and other health-related social needs resources. '
          + 'Common conditions seen in patients include uncontrolled chronic disease such as hypertension and diabetes, as well as wounds and other infections. '
          + 'Several patients may not have accessed health care for several months to years.\n\n'
          + 'PRESCRIBING MEDICATIONS\n'
          + 'If you feel comfortable prescribing medication for hypertension and diabetes, you can do so on your prescription pad. '
          + 'We are able to help patients pick up medications from the free Better Health Pharmacy in San Jose (no insurance needed): '
          + 'https://publichealth.santaclaracounty.gov/programs-and-services/pharmacy-and-vaccination-services/better-health-pharmacy\n\n'
          + 'A calendar invite has been sent separately and should appear on your calendar automatically.\n'
          + 'You will receive reminder emails at 1 week, 3 days, and 1 day before each shift.\n\n'
          + 'Preference: ' + (data.preference || 'on-site') + '\n\n'
          + 'If you have any questions, reply to this email or contact Saumya at ssao@stanford.edu.\n\n'
          + 'Thank you!\nSMOP Team',
        name: 'SMOP Volunteer Coordination'
      });
      Logger.log('Confirmation email sent to ' + data.email);
    } catch (err) {
      Logger.log('Confirmation email FAILED: ' + err.message);
    }

    try {
      MailApp.sendEmail({
        to: data.email,
        subject: 'SMOP Volunteer - Calendar Invite',
        body: 'Calendar invite for your SMOP volunteer shift(s).',
        name: 'SMOP Volunteer Coordination',
        attachments: [icsBlob]
      });
      Logger.log('Calendar invite sent to ' + data.email);
    } catch (err) {
      Logger.log('Calendar invite FAILED: ' + err.message);
    }

    scheduleReminders_('Clinician Reminders', data.email, data.name, data.shifts);

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (data.type === 'post-assessment') {
    var postSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Post Assessments');
    if (!postSheet) {
      postSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Post Assessments');
      postSheet.appendRow(['Timestamp', 'Name', 'Email', 'Shift', 'Answers']);
    }
    postSheet.appendRow([new Date(), data.name || '', data.email || '', data.shift || '', JSON.stringify(data.answers || {})]);
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (data.type === 'remove-volunteer') {
    return removeSignup_('Student Volunteers', 8, 'Volunteer Reminders', data, 'Volunteer not found for that shift');
  }

  if (data.type === 'remove-clinician') {
    return removeSignup_('Clinician Signups', 6, 'Clinician Reminders', data, 'Clinician not found for that shift');
  }

  if (data.type === 'student-volunteer') {
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Server busy, please try again in a moment.' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Student Volunteers');
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Student Volunteers');
      sheet.appendRow(['Timestamp', 'Name', 'Email', 'Phone', 'StudentType', 'Affiliation', 'SmopFellow', 'Languages', 'Shifts', 'Notes', 'CanDrive', 'HasBadgeAccess', 'IsEventLead']);
    }

    var shifts = Array.isArray(data.shifts) ? data.shifts.join('\n') : String(data.shifts);
    var languages = Array.isArray(data.languages) ? data.languages.join(', ') : String(data.languages || '');

    var capacityError = validateVolunteerCapacity_(sheet, data);
    if (capacityError) {
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: capacityError }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    sheet.appendRow([
      new Date(),
      data.name,
      data.email,
      data.phone || '',
      data.studentType || '',
      data.affiliation || '',
      data.smopFellow || false,
      languages,
      shifts,
      data.notes || '',
      data.canDrive || false,
      data.hasBadgeAccess || false,
      data.isEventLead || false
    ]);
    SpreadsheetApp.flush();

    auditLog_('SIGNUP', data.email, data.name, shifts);

    // Store pre-assessment if present (first-time volunteer)
    if (data.preAssessment && typeof data.preAssessment === 'object' && Object.keys(data.preAssessment).length > 0) {
      var preSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pre Assessments');
      if (!preSheet) {
        preSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Pre Assessments');
        preSheet.appendRow(['Timestamp', 'Name', 'Email', 'Answers']);
      }
      preSheet.appendRow([new Date(), data.name, data.email, JSON.stringify(data.preAssessment)]);
    }

    // Build calendar invite from structured shift data if available, else from text
    var icsShifts = shifts;
    if (data.shiftsStructured && Array.isArray(data.shiftsStructured)) {
      icsShifts = data.shiftsStructured;
    }
    var icsContent = buildIcs(icsShifts, data.name, data.email, 'volunteer');
    var icsBlob = Utilities.newBlob(icsContent, 'text/calendar; method=REQUEST', 'invite.ics');

    // Confirmation email
    try {
      MailApp.sendEmail({
        to: data.email,
        subject: 'SMOP Volunteer - Sign-Up Confirmation',
        body: 'Hi ' + data.name + ',\n\n'
          + 'Thank you for signing up to volunteer with the Stanford Medicine Outreach Program!\n\n'
          + 'You signed up for:\n' + shifts + '\n\n'
          + 'A calendar invite has been sent separately and should appear on your calendar automatically.\n'
          + 'You will receive reminder emails at 1 week, 3 days, and 1 day before each shift.\n\n'
          + 'A coordinator will be in touch before the event with details about transportation from LKSC and what to bring.\n\n'
          + 'If you have any questions, email our Clinical Outreach Committee Chair, Yaneth, at yanethp@stanford.edu.\n\n'
          + 'Thank you!\nSMOP Team',
        name: 'SMOP Volunteer Coordination'
      });
      Logger.log('Volunteer confirmation email sent to ' + data.email);
    } catch (err) {
      Logger.log('Volunteer confirmation email FAILED: ' + err.message);
    }

    // Calendar invite
    try {
      MailApp.sendEmail({
        to: data.email,
        subject: 'SMOP Volunteer - Calendar Invite',
        body: 'Calendar invite for your SMOP volunteer shift(s).',
        name: 'SMOP Volunteer Coordination',
        attachments: [icsBlob]
      });
      Logger.log('Volunteer calendar invite sent to ' + data.email);
    } catch (err) {
      Logger.log('Volunteer calendar invite FAILED: ' + err.message);
    }

    // Schedule reminders
    scheduleReminders_('Volunteer Reminders', data.email, data.name, data.shifts);

    lock.releaseLock();
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      lock.releaseLock();
      Logger.log('Student volunteer signup error: ' + err.message);
      auditLog_('ERROR', data.email || '', data.name || '', err.message);
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Something went wrong. Please try again.' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Hour logging (non-clinician)
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Service Hours');
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Service Hours');
    sheet.appendRow(['Timestamp', 'Name', 'Email', 'Date', 'Project', 'Hours', 'Patients Served', 'Description']);
  }

  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.name,
    data.email,
    data.date,
    data.project,
    data.hours,
    data.patientsServed || '',
    data.description || ''
  ]);

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var params = e.parameter;

  if (params.type === 'clinician-counts') {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Clinician Signups');
    var counts = {};
    var retiredCounts = {};
    if (sheet) {
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        var shiftsCell = data[i][6];
        var isRetired = data[i][8] === true || data[i][8] === 'true' || data[i][8] === 'TRUE';
        if (!shiftsCell) continue;
        var shiftLines = String(shiftsCell).split('\n');
        shiftLines.forEach(function(line) {
          line = line.trim();
          if (!line) return;
          var dateMatch = line.match(/^([A-Za-z]+,\s+[A-Za-z]+\s+\d+)/);
          var siteMatch = line.match(/—\s+(.+?)\s+\(/);
          if (dateMatch && siteMatch) {
            var key = dateMatch[1] + '|' + siteMatch[1];
            counts[key] = (counts[key] || 0) + 1;
            if (isRetired) {
              retiredCounts[key] = (retiredCounts[key] || 0) + 1;
            }
          }
        });
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ counts: counts, retiredCounts: retiredCounts }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (params.type === 'volunteer-counts') {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Student Volunteers');
    var result = {};
    if (sheet) {
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        var shiftsCell = data[i][8];
        var canDrive = data[i][10];
        var hasBadge = data[i][11];
        var isLead = data[i][12];
        var name = data[i][1];
        var email = data[i][2] || '';
        var phone = data[i][3] || '';
        var languages = String(data[i][7] || '').toLowerCase();
        if (!shiftsCell) continue;
        var shiftLines = String(shiftsCell).split('\n');
        shiftLines.forEach(function(line) {
          line = line.trim();
          if (!line) return;
          var dateMatch = line.match(/^([A-Za-z]+,\s+[A-Za-z]+\s+\d+)/);
          var siteMatch = line.match(/—\s+(.+?)\s+\(/);
          if (dateMatch && siteMatch) {
            var key = dateMatch[1] + '|' + siteMatch[1];
            if (!result[key]) result[key] = { drivers: 0, nonDrivers: 0, eventLead: '', driverList: [], nonDriverList: [], badgeHolders: [], clinicians: [], mandarinCount: 0, mdPaCount: 0 };
            var studentType = String(data[i][4] || '').toLowerCase();
            var person = { name: name, email: String(email), phone: String(phone), studentType: studentType, languages: String(data[i][7] || '') };
            if (studentType === 'md' || studentType === 'pa') {
              result[key].mdPaCount++;
            }
            if (languages.indexOf('mandarin') !== -1) {
              result[key].mandarinCount++;
            }
            if (canDrive === true || canDrive === 'true' || canDrive === 'TRUE') {
              result[key].drivers++;
              result[key].driverList.push(person);
            } else {
              result[key].nonDrivers++;
              result[key].nonDriverList.push(person);
            }
            if (hasBadge === true || hasBadge === 'true' || hasBadge === 'TRUE') {
              result[key].badgeHolders.push(name);
            }
            if ((isLead === true || isLead === 'true' || isLead === 'TRUE') && !result[key].eventLead) {
              result[key].eventLead = name;
            }
          }
        });
      }
    }

    // Cross-reference clinician signups by date+site
    var clinSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Clinician Signups');
    if (clinSheet) {
      var clinData = clinSheet.getDataRange().getValues();
      for (var i = 1; i < clinData.length; i++) {
        var clinName = clinData[i][1];
        var clinPhone = clinData[i][3] || '';
        var clinRole = clinData[i][4] || '';
        var clinShifts = clinData[i][6];
        if (!clinShifts) continue;
        var clinLines = String(clinShifts).split('\n');
        clinLines.forEach(function(line) {
          line = line.trim();
          if (!line) return;
          var dateMatch = line.match(/^([A-Za-z]+,\s+[A-Za-z]+\s+\d+)/);
          var siteMatch = line.match(/—\s+(.+?)\s+\(/);
          if (dateMatch && siteMatch) {
            var dateKey = dateMatch[1];
            // Match clinicians to any volunteer shift on the same date+site
            var key = dateKey + '|' + siteMatch[1];
            if (!result[key]) result[key] = { drivers: 0, nonDrivers: 0, eventLead: '', driverList: [], nonDriverList: [], badgeHolders: [], clinicians: [] };
            result[key].clinicians.push({ name: clinName, phone: String(clinPhone), role: clinRole });
          }
        });
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ shifts: result }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (params.email) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Service Hours');
    var entries = [];
    var totalHours = 0;
    var totalPatients = 0;
    if (sheet) {
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][2]).toLowerCase().trim() === params.email.toLowerCase().trim()) {
          var entry = {};
          for (var j = 0; j < headers.length; j++) {
            entry[headers[j]] = data[i][j];
          }
          entries.push(entry);
          totalHours += parseFloat(data[i][5]) || 0;
          totalPatients += parseInt(data[i][6]) || 0;
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify({
      entries: entries,
      totalHours: totalHours,
      totalPatients: totalPatients
    })).setMimeType(ContentService.MimeType.JSON);
  }

  if (params.type === 'check-email') {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Student Volunteers');
    var exists = false;
    if (sheet && params.email) {
      var data = sheet.getDataRange().getValues();
      var target = params.email.toLowerCase().trim();
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][2]).toLowerCase().trim() === target) {
          exists = true;
          break;
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ exists: exists }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ error: 'Unknown request' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- Shared helpers ---

// Removes one shift from a person's sign-up row (deleting the row if it was their only shift)
// and clears the matching row in the reminders sheet so they stop getting reminder emails.
function removeSignup_(signupSheetName, shiftsColIndex, reminderSheetName, data, notFoundMessage) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(signupSheetName);
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Sheet not found' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var rows = sheet.getDataRange().getValues();
  var targetName = String(data.name || '').trim();
  var targetDate = String(data.shiftDate || '').trim();
  var targetSite = String(data.shiftSite || '').trim();
  var removedCount = 0;

  for (var i = rows.length - 1; i >= 1; i--) {
    var rowName = String(rows[i][1] || '').trim();
    var shiftsCell = String(rows[i][shiftsColIndex] || '');
    if (rowName !== targetName) continue;

    var shiftLines = shiftsCell.split('\n');
    var remaining = [];
    var found = false;
    for (var k = 0; k < shiftLines.length; k++) {
      var line = shiftLines[k].trim();
      if (!found && line.indexOf(targetDate) !== -1 && line.indexOf(targetSite) !== -1) {
        found = true;
      } else {
        remaining.push(shiftLines[k]);
      }
    }
    if (found) {
      if (remaining.length === 0 || (remaining.length === 1 && remaining[0].trim() === '')) {
        sheet.deleteRow(i + 1);
      } else {
        sheet.getRange(i + 1, shiftsColIndex + 1).setValue(remaining.join('\n'));
      }
      removedCount++;
    }
  }

  if (removedCount > 0) {
    auditLog_('CANCEL', data.email || '', targetName, targetDate + ' — ' + targetSite);
    removeReminderRows_(reminderSheetName, targetName, targetDate, targetSite);
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', removed: removedCount }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: notFoundMessage }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Reminder sheet columns: Email, Name, ShiftText, ShiftDate, 7daySent, 3daySent, 1daySent
function removeReminderRows_(reminderSheetName, targetName, targetDate, targetSite) {
  var reminderSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(reminderSheetName);
  if (!reminderSheet) return;
  var rows = reminderSheet.getDataRange().getValues();
  for (var i = rows.length - 1; i >= 1; i--) {
    var rowName = String(rows[i][1] || '').trim();
    var shiftText = String(rows[i][2] || '');
    if (rowName === targetName && shiftText.indexOf(targetDate) !== -1 && shiftText.indexOf(targetSite) !== -1) {
      reminderSheet.deleteRow(i + 1);
    }
  }
}

function scheduleReminders_(sheetName, email, name, shifts) {
  var reminderSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!reminderSheet) {
    reminderSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(sheetName);
    reminderSheet.appendRow(['Email', 'Name', 'ShiftText', 'ShiftDate', '7daySent', '3daySent', '1daySent']);
  }

  var shiftLines = Array.isArray(shifts) ? shifts : [String(shifts)];
  shiftLines.forEach(function(shiftText) {
    var dateMatch = shiftText.match(/^[A-Za-z]+,\s+([A-Za-z]+\s+\d+)/);
    if (dateMatch) {
      var shiftDate = new Date(dateMatch[1] + ', 2026');
      reminderSheet.appendRow([
        email,
        name,
        shiftText,
        shiftDate,
        false,
        false,
        false
      ]);
    }
  });
}

function buildIcs(shiftsInput, attendeeName, attendeeEmail, type) {
  var now = new Date();
  var dtstamp = Utilities.formatDate(now, 'UTC', "yyyyMMdd'T'HHmmss'Z'");

  var lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SMOP//' + (type === 'clinician' ? 'Clinician' : 'Student') + ' Volunteer//EN',
    'METHOD:REQUEST',
    'CALSCALE:GREGORIAN',
    'BEGIN:VTIMEZONE',
    'TZID:America/Los_Angeles',
    'BEGIN:STANDARD',
    'DTSTART:19701101T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
    'TZOFFSETFROM:-0700',
    'TZOFFSETTO:-0800',
    'TZNAME:PST',
    'END:STANDARD',
    'BEGIN:DAYLIGHT',
    'DTSTART:19700308T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
    'TZOFFSETFROM:-0800',
    'TZOFFSETTO:-0700',
    'TZNAME:PDT',
    'END:DAYLIGHT',
    'END:VTIMEZONE'
  ];

  var structured = Array.isArray(shiftsInput) && shiftsInput.length > 0 && typeof shiftsInput[0] === 'object';

  if (structured) {
    shiftsInput.forEach(function(shift) {
      var start = new Date(shift.startDateTime);
      var durationMs = parseDuration_(shift.time);
      var end = new Date(start.getTime() + durationMs);

      var dtStart = Utilities.formatDate(start, 'America/Los_Angeles', "yyyyMMdd'T'HHmmss");
      var dtEnd = Utilities.formatDate(end, 'America/Los_Angeles', "yyyyMMdd'T'HHmmss");
      var site = shift.site || 'SMOP Site';
      var address = shift.address || '';
      var uid = dtStart + '-' + site.replace(/\s/g, '') + '-' + type + '@smop.stanford.edu';
      var summary = type === 'clinician'
        ? 'SMOP Clinician Volunteer - ' + site
        : 'SMOP Volunteer - ' + site;
      var description = type === 'clinician'
        ? 'Clinician volunteer shift with Stanford Medicine Outreach Program.'
        : 'Volunteer shift with Stanford Medicine Outreach Program.';

      lines.push(
        'BEGIN:VEVENT',
        'DTSTAMP:' + dtstamp,
        'DTSTART;TZID=America/Los_Angeles:' + dtStart,
        'DTEND;TZID=America/Los_Angeles:' + dtEnd,
        'SUMMARY:' + summary,
        'LOCATION:' + address,
        'DESCRIPTION:' + description,
        'UID:' + uid,
        'ORGANIZER;CN=SMOP:mailto:stanford.h.outreach@gmail.com',
        'ATTENDEE;CN=' + attendeeName + ';RSVP=TRUE:mailto:' + attendeeEmail,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'END:VEVENT'
      );
    });
  } else {
    var shiftsText = Array.isArray(shiftsInput) ? shiftsInput.join('\n') : String(shiftsInput);
    var shiftLines = shiftsText.split('\n');
    shiftLines.forEach(function(line) {
      line = line.trim();
      if (!line) return;

      var dateMatch = line.match(/^([A-Za-z]+,\s+[A-Za-z]+\s+\d+)/);
      var siteMatch = line.match(/—\s+(.+?)\s+\(/);
      var timeMatch = line.match(/\((\d+:\d+)\s/);
      var addressMatch = line.match(/,\s+(\d+.+?)\)$/);

      if (dateMatch) {
        var eventDate = new Date(dateMatch[1] + ', 2026');
        if (timeMatch) {
          var timeParts = timeMatch[1].split(':');
          eventDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]));
        }

        var dtStart = Utilities.formatDate(eventDate, 'America/Los_Angeles', "yyyyMMdd'T'HHmmss");
        var endDate = new Date(eventDate.getTime() + 90 * 60 * 1000);
        var dtEnd = Utilities.formatDate(endDate, 'America/Los_Angeles', "yyyyMMdd'T'HHmmss");
        var site = siteMatch ? siteMatch[1] : 'SMOP Site';
        var address = addressMatch ? addressMatch[1] : '';
        var uid = dtStart + '-' + site.replace(/\s/g, '') + '-' + type + '@smop.stanford.edu';
        var summary = type === 'clinician'
          ? 'SMOP Clinician Volunteer - ' + site
          : 'SMOP Volunteer - ' + site;

        lines.push(
          'BEGIN:VEVENT',
          'DTSTAMP:' + dtstamp,
          'DTSTART;TZID=America/Los_Angeles:' + dtStart,
          'DTEND;TZID=America/Los_Angeles:' + dtEnd,
          'SUMMARY:' + summary,
          'LOCATION:' + address,
          'DESCRIPTION:' + (type === 'clinician' ? 'Clinician volunteer' : 'Volunteer') + ' shift with Stanford Medicine Outreach Program.',
          'UID:' + uid,
          'ORGANIZER;CN=SMOP:mailto:stanford.h.outreach@gmail.com',
          'ATTENDEE;CN=' + attendeeName + ';RSVP=TRUE:mailto:' + attendeeEmail,
          'STATUS:CONFIRMED',
          'SEQUENCE:0',
          'END:VEVENT'
        );
      }
    });
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function parseDuration_(timeStr) {
  // Parse "7:45 – 10:45 am" or "11:00 am – 1:30 pm" or "5:15 – 7:45 pm" into ms duration
  var match = timeStr.match(/(\d+):(\d+)\s*(am|pm)?\s*[–\-]+\s*(\d+):(\d+)\s*(am|pm)/i);
  if (!match) return 90 * 60 * 1000; // fallback 90 min

  var startH = parseInt(match[1]);
  var startM = parseInt(match[2]);
  var startAmPm = match[3] ? match[3].toLowerCase() : null;
  var endH = parseInt(match[4]);
  var endM = parseInt(match[5]);
  var endAmPm = match[6].toLowerCase();

  // Convert to 24h
  if (endAmPm === 'pm' && endH !== 12) endH += 12;
  if (endAmPm === 'am' && endH === 12) endH = 0;

  if (startAmPm) {
    if (startAmPm === 'pm' && startH !== 12) startH += 12;
    if (startAmPm === 'am' && startH === 12) startH = 0;
  } else {
    // Infer: if start > end in same meridiem, start is AM
    if (startH <= 12 && endAmPm === 'pm') {
      if (startH > endH - 12 && startH !== 12) {
        // start is AM (e.g., "11:00 am – 1:30 pm" but startAmPm missing means "11:00 – 1:30 pm")
      } else if (startH < endH) {
        // Both PM
        startH += 12;
      }
    }
  }

  var startMin = startH * 60 + startM;
  var endMin = endH * 60 + endM;
  if (endMin <= startMin) endMin += 12 * 60;

  return (endMin - startMin) * 60 * 1000;
}

function sendClinicianReminders() {
  sendReminders_('Clinician Reminders', 'clinician');
}

function sendVolunteerReminders() {
  sendReminders_('Volunteer Reminders', 'volunteer');
}

function sendReminders_(sheetName, type) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var oneDay = 24 * 60 * 60 * 1000;

  var isClinician = (type === 'clinician');
  var ccRecipients = isClinician ? 'ssao@stanford.edu,yanethp@stanford.edu' : '';

  for (var i = 1; i < data.length; i++) {
    var email = data[i][0];
    var name = data[i][1];
    var shiftText = data[i][2];
    var shiftDate = new Date(data[i][3]);
    var shiftDay = new Date(shiftDate.getFullYear(), shiftDate.getMonth(), shiftDate.getDate());
    var sent7 = data[i][4];
    var sent3 = data[i][5];
    var sent1 = data[i][6];

    var daysUntil = Math.round((shiftDay.getTime() - today.getTime()) / oneDay);

    var reminderBody = null;
    var reminderSubject = null;
    var colToMark = -1;

    if (daysUntil <= 7 && daysUntil > 3 && !sent7) {
      reminderSubject = 'SMOP Shift Reminder — 1 Week Away';
      reminderBody = 'Hi ' + name + ',\n\n'
        + 'Friendly reminder: you signed up for an SMOP volunteer shift in 1 week!\n\n'
        + shiftText + '\n\n'
        + 'Please let us know if you can no longer make it by replying to this email.\n\n'
        + 'Thank you!\nSMOP Team';
      colToMark = 5;
    } else if (daysUntil <= 3 && daysUntil > 1 && !sent3) {
      reminderSubject = 'SMOP Shift Reminder — 3 Days Away';
      if (isClinician) {
        reminderBody = 'Hi ' + name + ',\n\n'
          + 'Reminder: your SMOP volunteer shift is in 3 days!\n\n'
          + shiftText + '\n\n'
          + 'Quick refresher on your two options:\n'
          + '1. Supportive Role — stay in the background, help students interpret BP/glucose readings\n'
          + '2. Active Triage — introduce yourself as a physician, expect patients with uncontrolled chronic conditions\n\n'
          + 'Please let us know if you can no longer make it by replying to this email.\n\n'
          + 'Thank you!\nSMOP Team';
      } else {
        reminderBody = 'Hi ' + name + ',\n\n'
          + 'Reminder: your SMOP volunteer shift is in 3 days!\n\n'
          + shiftText + '\n\n'
          + 'A coordinator will reach out with transportation details from LKSC and what to bring.\n'
          + 'Please let us know if you can no longer make it by replying to this email.\n\n'
          + 'Thank you!\nSMOP Team';
      }
      colToMark = 6;
    } else if (daysUntil <= 1 && daysUntil >= 0 && !sent1) {
      reminderSubject = 'SMOP Shift Reminder — TOMORROW';
      if (isClinician) {
        reminderBody = 'Hi ' + name + ',\n\n'
          + 'Your SMOP volunteer shift is TOMORROW!\n\n'
          + shiftText + '\n\n'
          + 'We have a "Clinician\'s kit" packed in our supplies bin. The "Clinician\'s kit" is a little clear plastic box that has a stethoscope, reflex hammer, pen light, medical tape, extra batteries (for the blood pressure and blood sugar machines), and notebook and pens to write down peoples\' blood pressure or blood sugar readings if they want to take their readings home with them. Additional supplies in our supplies bin:\n\n'
          + '- 2 automatic blood pressure machines\n'
          + '- 1 XL blood pressure cuff attachment\n'
          + '- 1 manual blood pressure cuff if needed\n'
          + '- Blood sugar toolbox (contains gauze, blood sugar machine, lancets, etc.)\n'
          + '- Biohazard bags\n'
          + '- Sharps disposal box\n'
          + '- Gloves\n\n'
          + 'If you find yourself in need of anything else, just send me an email ssao@stanford.edu and I\'m happy to order it to keep in our supplies for next time.\n\n'
          + 'PRESCRIBING MEDICATIONS\n'
          + 'If you feel comfortable prescribing medication for hypertension and diabetes, you can do so on your prescription pad. '
          + 'We are able to help patients pick up medications from the free Better Health Pharmacy in San Jose (no insurance needed): '
          + 'https://publichealth.santaclaracounty.gov/programs-and-services/pharmacy-and-vaccination-services/better-health-pharmacy\n\n'
          + 'We look forward to seeing you. If you have any last-minute questions, reply here or text Saumya at 407-590-7065.\n\n'
          + 'Thank you!\nSMOP Team';
      } else {
        reminderBody = 'Hi ' + name + ',\n\n'
          + 'Your SMOP volunteer shift is TOMORROW!\n\n'
          + shiftText + '\n\n'
          + 'We look forward to seeing you. If you have any last-minute questions, reply here or text Yaneth at (346) 242-4484.\n\n'
          + 'Thank you!\nSMOP Team';
      }
      colToMark = 7;
    }

    if (reminderBody && colToMark > 0) {
      try {
        var emailOptions = {
          to: email,
          subject: reminderSubject,
          body: reminderBody,
          name: 'SMOP Volunteer Coordination'
        };
        if (isClinician) {
          emailOptions.cc = ccRecipients;
        } else {
          emailOptions.replyTo = 'yanethp@stanford.edu';
        }
        MailApp.sendEmail(emailOptions);
        sheet.getRange(i + 1, colToMark).setValue(true);
      } catch (err) {
        Logger.log('Reminder error for ' + email + ': ' + err.message);
      }
    }
  }
}

function validateVolunteerCapacity_(sheet, data) {
  var SITE_CAPACITY = {
    "Hope's Corner": { drivers: 2, nonDrivers: 4 },
    "Neighborhood Hands": { drivers: 3, nonDrivers: 4 },
    "Helping Hands at Sunnyvale Public Library": { drivers: 3, nonDrivers: 4 },
    "Hope for the Unhoused": { drivers: 3, nonDrivers: 4 },
    "WeHOPE": { drivers: 2, nonDrivers: 4 },
    "Peninsula Healthcare Connections": { drivers: 0, nonDrivers: 4 },
    "Family Community Church Fall Fest": { drivers: 2, nonDrivers: 4, driverRatio: 2 },
    "WeHOPE Berryessa Safe RV Parking": { drivers: 3, nonDrivers: 4 }
  };
  var MANDARIN_ONLY_SITE = "Hope's Corner";

  // Build current counts per shift from existing sheet data
  var counts = {};
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    var shiftsCell = rows[i][8];
    var rowCanDrive = rows[i][10];
    var rowStudentType = String(rows[i][4] || '').toLowerCase();
    var rowLanguages = String(rows[i][7] || '').toLowerCase();
    if (!shiftsCell) continue;
    var lines = String(shiftsCell).split('\n');
    lines.forEach(function(line) {
      line = line.trim();
      if (!line) return;
      var dateMatch = line.match(/^([A-Za-z]+,\s+[A-Za-z]+\s+\d+)/);
      var siteMatch = line.match(/—\s+(.+?)\s+\(/);
      if (dateMatch && siteMatch) {
        var key = dateMatch[1] + '|' + siteMatch[1];
        if (!counts[key]) counts[key] = { drivers: 0, nonDrivers: 0, mdPaCount: 0, mandarinCount: 0 };
        if (rowCanDrive === true || rowCanDrive === 'true' || rowCanDrive === 'TRUE') {
          counts[key].drivers++;
        } else {
          counts[key].nonDrivers++;
        }
        if (rowStudentType === 'md' || rowStudentType === 'pa') counts[key].mdPaCount++;
        if (rowLanguages.indexOf('mandarin') !== -1) counts[key].mandarinCount++;
      }
    });
  }

  // Validate each shift the volunteer is signing up for
  var shiftLines = Array.isArray(data.shifts) ? data.shifts : [String(data.shifts)];
  var canDrive = data.canDrive === true || data.canDrive === 'true';
  var studentType = String(data.studentType || '').toLowerCase();
  var isMdPa = studentType === 'md' || studentType === 'pa';

  // Per-student shift limit: 8 shifts for non-MD/PA students
  var MAX_SHIFTS_NON_MDPA = 8;
  if (!isMdPa) {
    var volunteerEmail = String(data.email || '').toLowerCase().trim();
    var QUARTER_START = new Date('2026-09-22').getTime();
    var existingShiftCount = 0;
    for (var r = 1; r < rows.length; r++) {
      var rowEmail = String(rows[r][2] || '').toLowerCase().trim();
      if (rowEmail !== volunteerEmail) continue;
      var rowShifts = String(rows[r][7] || '');
      var rowLines = rowShifts.split('\n');
      for (var rl = 0; rl < rowLines.length; rl++) {
        var rl_trimmed = rowLines[rl].trim();
        if (!rl_trimmed) continue;
        var rlDateMatch = rl_trimmed.match(/^[A-Za-z]+,\s+([A-Za-z]+\s+\d+)/);
        if (rlDateMatch) {
          var rlDate = new Date(rlDateMatch[1] + ', 2026').getTime();
          if (rlDate < QUARTER_START) continue;
        }
        existingShiftCount++;
      }
    }
    var newShiftCount = shiftLines.filter(function(l) {
      if (!l.trim()) return false;
      var m = l.trim().match(/^[A-Za-z]+,\s+([A-Za-z]+\s+\d+)/);
      if (m) { return new Date(m[1] + ', 2026').getTime() >= QUARTER_START; }
      return true;
    }).length;
    if (existingShiftCount + newShiftCount > MAX_SHIFTS_NON_MDPA) {
      return 'You have already signed up for ' + existingShiftCount + ' shift(s). Non-MD/PA students are limited to ' + MAX_SHIFTS_NON_MDPA + ' shifts per quarter. You can sign up for ' + Math.max(0, MAX_SHIFTS_NON_MDPA - existingShiftCount) + ' more.';
    }
  }

  var langs = Array.isArray(data.languages) ? data.languages.join(',').toLowerCase() : String(data.languages || '').toLowerCase();
  var speaksMandarin = langs.indexOf('mandarin') !== -1;

  for (var j = 0; j < shiftLines.length; j++) {
    var line = shiftLines[j].trim();
    if (!line) continue;
    var dateMatch = line.match(/^([A-Za-z]+,\s+[A-Za-z]+\s+\d+)/);
    var siteMatch = line.match(/—\s+(.+?)\s+\(/);
    if (!dateMatch || !siteMatch) continue;

    var key = dateMatch[1] + '|' + siteMatch[1];
    var site = siteMatch[1];
    var cap = SITE_CAPACITY[site] || { drivers: 3, nonDrivers: 4 };
    var c = counts[key] || { drivers: 0, nonDrivers: 0, mdPaCount: 0, mandarinCount: 0 };

    var effectiveNonDriverCap = cap.driverRatio ? Math.min(cap.nonDrivers, c.drivers * cap.driverRatio) : cap.nonDrivers;

    // Reserve 2 spots for MD/PA students on every shift
    var userNonDriverCap = effectiveNonDriverCap;
    if (!isMdPa) {
      var reserved = Math.max(0, 2 - (c.mdPaCount || 0));
      userNonDriverCap = Math.max(0, effectiveNonDriverCap - reserved);
    }

    var assignedAsDriver = false;
    if (canDrive && c.drivers < cap.drivers) {
      assignedAsDriver = true;
    } else if (c.nonDrivers < userNonDriverCap) {
      assignedAsDriver = false;
    } else if (speaksMandarin && site === MANDARIN_ONLY_SITE && c.mandarinCount === 0) {
      assignedAsDriver = false;
    } else {
      return 'All spots are full for ' + line;
    }

    // Update counts for subsequent shift checks in the same submission
    if (assignedAsDriver) {
      if (!counts[key]) counts[key] = { drivers: 0, nonDrivers: 0, mdPaCount: 0, mandarinCount: 0 };
      counts[key].drivers++;
    } else {
      if (!counts[key]) counts[key] = { drivers: 0, nonDrivers: 0, mdPaCount: 0, mandarinCount: 0 };
      counts[key].nonDrivers++;
    }
    if (isMdPa) { if (!counts[key]) counts[key] = { drivers: 0, nonDrivers: 0, mdPaCount: 0, mandarinCount: 0 }; counts[key].mdPaCount++; }
    if (speaksMandarin) { if (!counts[key]) counts[key] = { drivers: 0, nonDrivers: 0, mdPaCount: 0, mandarinCount: 0 }; counts[key].mandarinCount++; }
  }

  return null; // all shifts valid
}

function sendPostShiftEmails() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Volunteer Reminders');
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var postSentCol = headers.indexOf('PostSent');
  if (postSentCol === -1) {
    postSentCol = headers.length;
    sheet.getRange(1, postSentCol + 1).setValue('PostSent');
  }

  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var oneDay = 24 * 60 * 60 * 1000;
  var siteUrl = 'https://smop-volunteer.vercel.app';

  for (var i = 1; i < data.length; i++) {
    var email = data[i][0];
    var name = data[i][1];
    var shiftText = data[i][2];
    var shiftDate = new Date(data[i][3]);
    var shiftDay = new Date(shiftDate.getFullYear(), shiftDate.getMonth(), shiftDate.getDate());
    var postSent = data[i][postSentCol];

    var daysSince = Math.round((today.getTime() - shiftDay.getTime()) / oneDay);

    if (daysSince >= 1 && daysSince <= 3 && !postSent) {
      var assessmentUrl = siteUrl + '?view=post-assessment'
        + '&email=' + encodeURIComponent(email)
        + '&name=' + encodeURIComponent(name)
        + '&shift=' + encodeURIComponent(shiftText);

      try {
        MailApp.sendEmail({
          to: email,
          subject: 'SMOP Post-Shift Assessment',
          body: 'Hi ' + name + ',\n\n'
            + 'Thank you for volunteering with SMOP! We hope you had a great experience.\n\n'
            + 'We would love to hear about your shift. Please take a moment to fill out this brief post-shift assessment:\n\n'
            + assessmentUrl + '\n\n'
            + 'Your feedback helps us understand how SMOP is impacting your growth as a future clinician.\n\n'
            + 'Thank you!\nSMOP Team',
          name: 'SMOP Volunteer Coordination',
          replyTo: 'yanethp@stanford.edu'
        });
        sheet.getRange(i + 1, postSentCol + 1).setValue(true);
      } catch (err) {
        Logger.log('Post-shift email error for ' + email + ': ' + err.message);
      }
    }
  }
}

function createReminderTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    var fn = trigger.getHandlerFunction();
    if (fn === 'sendClinicianReminders' || fn === 'sendVolunteerReminders' || fn === 'sendPostShiftEmails') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('sendClinicianReminders')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();

  ScriptApp.newTrigger('sendVolunteerReminders')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();

  ScriptApp.newTrigger('sendPostShiftEmails')
    .timeBased()
    .everyDays(1)
    .atHour(20)
    .create();
}

function auditLog_(action, email, name, details) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Audit Log');
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Audit Log');
      sheet.appendRow(['Timestamp', 'Action', 'Email', 'Name', 'Details']);
    }
    sheet.appendRow([new Date(), action, email, name, details]);
  } catch (err) {
    Logger.log('Audit log error: ' + err.message);
  }
}
