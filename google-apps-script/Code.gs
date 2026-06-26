function doPost(e) {
  var data = JSON.parse(e.postData.contents);

  if (data.type === 'clinician') {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Clinician Signups');
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Clinician Signups');
      sheet.appendRow(['Timestamp', 'Name', 'Email', 'Phone', 'Role', 'Preference', 'Shifts', 'Notes']);
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
      data.notes || ''
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

  if (data.type === 'student-volunteer') {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Student Volunteers');
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Student Volunteers');
      sheet.appendRow(['Timestamp', 'Name', 'Email', 'Phone', 'StudentType', 'SmopFellow', 'Languages', 'Shifts', 'Notes', 'CanDrive', 'HasBadgeAccess', 'IsEventLead']);
    }

    var shifts = Array.isArray(data.shifts) ? data.shifts.join('\n') : String(data.shifts);
    var languages = Array.isArray(data.languages) ? data.languages.join(', ') : String(data.languages || '');

    sheet.appendRow([
      new Date(),
      data.name,
      data.email,
      data.phone || '',
      data.studentType || '',
      data.smopFellow || false,
      languages,
      shifts,
      data.notes || '',
      data.canDrive || false,
      data.hasBadgeAccess || false,
      data.isEventLead || false
    ]);

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
          + 'If you have any questions, email us at stanford.h.outreach@gmail.com.\n\n'
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

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
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
    if (sheet) {
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        var shiftsCell = data[i][6];
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
          }
        });
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ counts: counts }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (params.type === 'volunteer-counts') {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Student Volunteers');
    var result = {};
    if (sheet) {
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        var shiftsCell = data[i][7];
        var canDrive = data[i][9];
        var hasBadge = data[i][10];
        var isLead = data[i][11];
        var name = data[i][1];
        var phone = data[i][3] || '';
        var languages = String(data[i][6] || '').toLowerCase();
        if (!shiftsCell) continue;
        var shiftLines = String(shiftsCell).split('\n');
        shiftLines.forEach(function(line) {
          line = line.trim();
          if (!line) return;
          var dateMatch = line.match(/^([A-Za-z]+,\s+[A-Za-z]+\s+\d+)/);
          var siteMatch = line.match(/—\s+(.+?)\s+\(/);
          if (dateMatch && siteMatch) {
            var key = dateMatch[1] + '|' + siteMatch[1];
            if (!result[key]) result[key] = { drivers: 0, nonDrivers: 0, eventLead: '', driverList: [], nonDriverList: [], badgeHolders: [], clinicians: [], mandarinCount: 0 };
            var person = { name: name, phone: String(phone) };
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

  return ContentService.createTextOutput(JSON.stringify({ error: 'Unknown request' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- Shared helpers ---

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
  var oneDay = 24 * 60 * 60 * 1000;

  var isClinician = (type === 'clinician');
  var ccRecipients = isClinician ? 'ssao@stanford.edu,yanethp@stanford.edu' : '';

  for (var i = 1; i < data.length; i++) {
    var email = data[i][0];
    var name = data[i][1];
    var shiftText = data[i][2];
    var shiftDate = new Date(data[i][3]);
    var sent7 = data[i][4];
    var sent3 = data[i][5];
    var sent1 = data[i][6];

    var daysUntil = Math.floor((shiftDate.getTime() - now.getTime()) / oneDay);

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
      reminderBody = 'Hi ' + name + ',\n\n'
        + 'Your SMOP volunteer shift is TOMORROW!\n\n'
        + shiftText + '\n\n'
        + 'We look forward to seeing you. If you have any last-minute questions, reply here or text Saumya at 407-590-7065.\n\n'
        + 'Thank you!\nSMOP Team';
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
        if (ccRecipients) {
          emailOptions.cc = ccRecipients;
        }
        MailApp.sendEmail(emailOptions);
        sheet.getRange(i + 1, colToMark).setValue(true);
      } catch (err) {
        Logger.log('Reminder error for ' + email + ': ' + err.message);
      }
    }
  }
}

function createReminderTriggers() {
  // Remove existing triggers to avoid duplicates
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    var fn = trigger.getHandlerFunction();
    if (fn === 'sendClinicianReminders' || fn === 'sendVolunteerReminders') {
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
}
