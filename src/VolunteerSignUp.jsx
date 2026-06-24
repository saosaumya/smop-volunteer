import { useState, useMemo, useEffect } from 'react';
import { HiCheckCircle, HiExclamationCircle, HiInformationCircle } from 'react-icons/hi';

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

const allShifts = [
  { date: 'Saturday, June 27', startDateTime: '2026-06-27T07:45:00', time: '7:45 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Saturday, June 27', startDateTime: '2026-06-27T11:00:00', time: '11:00 am – 1:30 pm', site: 'Helping Hands at Sunnyvale Public Library', address: '665 W Olive Ave, Sunnyvale, CA 94086' },
  { date: 'Sunday, June 28', startDateTime: '2026-06-28T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Saturday, July 11', startDateTime: '2026-07-11T07:15:00', time: '7:15 – 10:30 am', site: "Hope's Corner", address: '748 Mercy St, Mountain View, CA 94041' },
  { date: 'Saturday, July 11', startDateTime: '2026-07-11T07:45:00', time: '7:45 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Sunday, July 12', startDateTime: '2026-07-12T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Tuesday, July 14', startDateTime: '2026-07-14T17:15:00', time: '5:15 – 7:45 pm', site: 'WeHOPE', address: '1854 Bay Road, East Palo Alto, CA 94303' },
  { date: 'Saturday, July 25', startDateTime: '2026-07-25T07:45:00', time: '7:45 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Saturday, July 25', startDateTime: '2026-07-25T11:00:00', time: '11:00 am – 1:30 pm', site: 'Helping Hands at Sunnyvale Public Library', address: '665 W Olive Ave, Sunnyvale, CA 94086' },
  { date: 'Sunday, July 26', startDateTime: '2026-07-26T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Saturday, August 8', startDateTime: '2026-08-08T07:15:00', time: '7:15 – 10:30 am', site: "Hope's Corner", address: '748 Mercy St, Mountain View, CA 94041' },
  { date: 'Saturday, August 8', startDateTime: '2026-08-08T07:45:00', time: '7:45 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Sunday, August 9', startDateTime: '2026-08-09T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Tuesday, August 11', startDateTime: '2026-08-11T17:15:00', time: '5:15 – 7:45 pm', site: 'WeHOPE', address: '1854 Bay Road, East Palo Alto, CA 94303' },
  { date: 'Saturday, August 22', startDateTime: '2026-08-22T07:45:00', time: '7:45 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Sunday, August 23', startDateTime: '2026-08-23T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Saturday, August 29', startDateTime: '2026-08-29T11:00:00', time: '11:00 am – 1:30 pm', site: 'Helping Hands at Sunnyvale Public Library', address: '665 W Olive Ave, Sunnyvale, CA 94086' },
  { date: 'Saturday, September 5', startDateTime: '2026-09-05T07:45:00', time: '7:45 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Sunday, September 6', startDateTime: '2026-09-06T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Tuesday, September 8', startDateTime: '2026-09-08T17:15:00', time: '5:15 – 7:45 pm', site: 'WeHOPE', address: '1854 Bay Road, East Palo Alto, CA 94303' },
  { date: 'Saturday, September 12', startDateTime: '2026-09-12T07:15:00', time: '7:15 – 10:30 am', site: "Hope's Corner", address: '748 Mercy St, Mountain View, CA 94041' },
  { date: 'Saturday, September 19', startDateTime: '2026-09-19T07:45:00', time: '7:45 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Sunday, September 20', startDateTime: '2026-09-20T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Saturday, September 26', startDateTime: '2026-09-26T11:00:00', time: '11:00 am – 1:30 pm', site: 'Helping Hands at Sunnyvale Public Library', address: '665 W Olive Ave, Sunnyvale, CA 94086' },
  { date: 'Saturday, October 3', startDateTime: '2026-10-03T07:45:00', time: '7:45 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Sunday, October 4', startDateTime: '2026-10-04T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Saturday, October 10', startDateTime: '2026-10-10T07:15:00', time: '7:15 – 10:30 am', site: "Hope's Corner", address: '748 Mercy St, Mountain View, CA 94041' },
  { date: 'Tuesday, October 13', startDateTime: '2026-10-13T17:15:00', time: '5:15 – 7:45 pm', site: 'WeHOPE', address: '1854 Bay Road, East Palo Alto, CA 94303' },
  { date: 'Saturday, October 17', startDateTime: '2026-10-17T07:45:00', time: '7:45 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Sunday, October 18', startDateTime: '2026-10-18T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Saturday, October 31', startDateTime: '2026-10-31T07:45:00', time: '7:45 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Saturday, October 31', startDateTime: '2026-10-31T11:00:00', time: '11:00 am – 1:30 pm', site: 'Helping Hands at Sunnyvale Public Library', address: '665 W Olive Ave, Sunnyvale, CA 94086' },
  { date: 'Sunday, November 1', startDateTime: '2026-11-01T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Tuesday, November 10', startDateTime: '2026-11-10T17:15:00', time: '5:15 – 7:45 pm', site: 'WeHOPE', address: '1854 Bay Road, East Palo Alto, CA 94303' },
  { date: 'Saturday, November 14', startDateTime: '2026-11-14T07:15:00', time: '7:15 – 10:30 am', site: "Hope's Corner", address: '748 Mercy St, Mountain View, CA 94041' },
  { date: 'Saturday, November 14', startDateTime: '2026-11-14T07:45:00', time: '7:45 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Sunday, November 15', startDateTime: '2026-11-15T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Saturday, November 28', startDateTime: '2026-11-28T07:45:00', time: '7:45 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Saturday, November 28', startDateTime: '2026-11-28T11:00:00', time: '11:00 am – 1:30 pm', site: 'Helping Hands at Sunnyvale Public Library', address: '665 W Olive Ave, Sunnyvale, CA 94086' },
  { date: 'Sunday, November 29', startDateTime: '2026-11-29T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Tuesday, December 8', startDateTime: '2026-12-08T17:15:00', time: '5:15 – 7:45 pm', site: 'WeHOPE', address: '1854 Bay Road, East Palo Alto, CA 94303' },
  { date: 'Saturday, December 12', startDateTime: '2026-12-12T07:15:00', time: '7:15 – 10:30 am', site: "Hope's Corner", address: '748 Mercy St, Mountain View, CA 94041' },
  { date: 'Saturday, December 12', startDateTime: '2026-12-12T07:45:00', time: '7:45 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Sunday, December 13', startDateTime: '2026-12-13T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Saturday, December 26', startDateTime: '2026-12-26T07:45:00', time: '7:45 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Saturday, December 26', startDateTime: '2026-12-26T11:00:00', time: '11:00 am – 1:30 pm', site: 'Helping Hands at Sunnyvale Public Library', address: '665 W Olive Ave, Sunnyvale, CA 94086' },
];

const SITE_CAPACITY = {
  "Hope's Corner": { drivers: 2, nonDrivers: 3 },
  "Neighborhood Hands": { drivers: 3, nonDrivers: 3 },
  "Helping Hands at Sunnyvale Public Library": { drivers: 3, nonDrivers: 3 },
  "Hope for the Unhoused": { drivers: 3, nonDrivers: 3 },
  "WeHOPE": { drivers: 2, nonDrivers: 3 },
};

const MD_PA_PRIORITY_SITES = ["Hope's Corner", 'Neighborhood Hands', 'Helping Hands at Sunnyvale Public Library'];
const MANDARIN_ONLY_SITE = "Hope's Corner";
const SPANISH_PRIORITY_SITES = ['Neighborhood Hands', 'Hope for the Unhoused'];

function shiftKey(shift) {
  return `${shift.date}|${shift.site}`;
}

function getSiteTag(shift, form) {
  const isMdPa = form.studentType === 'md' || form.studentType === 'pa';
  const speaksMandarin = form.languages.includes('mandarin');
  const speaksSpanish = form.languages.includes('spanish');
  const isFellow = form.smopFellow;

  if (speaksMandarin && !isFellow && shift.site === MANDARIN_ONLY_SITE) {
    return { text: 'Mandarin speakers needed here', color: 'text-green-700 bg-green-50' };
  }
  if (isMdPa && MD_PA_PRIORITY_SITES.includes(shift.site)) {
    return { text: 'Priority for MD/PA students', color: 'text-purple-700 bg-purple-50' };
  }
  if (speaksSpanish && SPANISH_PRIORITY_SITES.includes(shift.site)) {
    return { text: 'Spanish speakers most needed', color: 'text-blue-700 bg-blue-50' };
  }
  return null;
}

function isShiftAllowed(shift, form) {
  const speaksMandarin = form.languages.includes('mandarin');
  const isFellow = form.smopFellow;
  if (speaksMandarin && !isFellow) {
    return shift.site === MANDARIN_ONLY_SITE;
  }
  return true;
}

export default function VolunteerSignUp() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    studentType: '',
    smopFellow: false,
    languages: [],
    canDrive: false,
    hasBadgeAccess: false,
    isEventLead: false,
    shifts: [],
    notes: '',
  });
  const [status, setStatus] = useState('idle');
  const [shiftData, setShiftData] = useState({});

  useEffect(() => {
    if (!SCRIPT_URL) return;
    fetch(`${SCRIPT_URL}?type=volunteer-counts`)
      .then(res => res.json())
      .then(data => setShiftData(data.shifts || {}))
      .catch(() => {});
  }, []);

  const now = Date.now();
  const futureShifts = allShifts.filter(s => new Date(s.startDateTime).getTime() > now);

  const availableShifts = useMemo(() => {
    return futureShifts.filter(shift => isShiftAllowed(shift, form));
  }, [futureShifts, form.languages, form.smopFellow]);

  const handleLanguageToggle = (lang) => {
    setForm(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang],
      shifts: [],
    }));
  };

  const handleShiftToggle = (i) => {
    setForm(prev => ({
      ...prev,
      shifts: prev.shifts.includes(i) ? prev.shifts.filter(s => s !== i) : [...prev.shifts, i],
    }));
  };

  function getShiftStatus(shift) {
    const key = shiftKey(shift);
    const data = shiftData[key] || { drivers: 0, nonDrivers: 0, eventLead: '' };
    const cap = SITE_CAPACITY[shift.site] || { drivers: 3, nonDrivers: 3 };
    return { ...data, capDrivers: cap.drivers, capNonDrivers: cap.nonDrivers };
  }

  function isShiftFull(shift) {
    const s = getShiftStatus(shift);
    if (form.canDrive) {
      return s.drivers >= s.capDrivers && s.nonDrivers >= s.capNonDrivers;
    }
    return s.nonDrivers >= s.capNonDrivers && s.drivers >= s.capDrivers;
  }

  function getSlotForUser(shift) {
    const s = getShiftStatus(shift);
    if (form.canDrive && s.drivers < s.capDrivers) return 'driver';
    if (s.nonDrivers < s.capNonDrivers) return 'non-driver';
    if (form.canDrive && s.drivers < s.capDrivers) return 'driver';
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const selectedShifts = form.shifts.map(i => availableShifts[i]);
      const shiftsFormatted = selectedShifts.map(s => `${s.date} — ${s.site} (${s.time}, ${s.address})`);
      const shiftsStructured = selectedShifts.map(s => ({
        date: s.date,
        startDateTime: s.startDateTime,
        time: s.time,
        site: s.site,
        address: s.address,
      }));
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'student-volunteer',
          name: form.name,
          email: form.email,
          phone: form.phone,
          studentType: form.studentType,
          smopFellow: form.smopFellow,
          languages: form.languages,
          canDrive: form.canDrive,
          hasBadgeAccess: form.hasBadgeAccess,
          isEventLead: form.isEventLead,
          shifts: shiftsFormatted,
          shiftsStructured: shiftsStructured,
          notes: form.notes,
        }),
      });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  const showMandarinNotice = form.languages.includes('mandarin') && !form.smopFellow;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-cardinal to-cardinal-dark text-white py-12">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Stanford Medicine Outreach Program</h1>
          <p className="text-white/80">Volunteer Sign-Up</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {status === 'success' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <HiCheckCircle className="mx-auto text-green-600 mb-3" size={48} />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">You're signed up!</h2>
            <p className="text-gray-600 text-sm mb-3">
              A calendar invite has been sent to your email — it should appear on your calendar automatically.
            </p>
            <p className="text-gray-600 text-sm mb-3">
              You'll receive reminder emails at 1 week, 3 days, and 1 day before each shift.
            </p>
            <p className="text-gray-600 text-sm mb-4">
              A coordinator will also be in touch before the event with details about transportation from LKSC and what to bring.
            </p>
            <p className="text-gray-600 text-sm mb-4">
              Need to cancel a shift? Email SMOP volunteer coordinator <a href="mailto:jghazal@stanford.edu" className="text-cardinal hover:underline">jghazal@stanford.edu</a>.
            </p>
            <p className="text-gray-500 text-xs">
              Questions? Email <a href="mailto:stanford.h.outreach@gmail.com" className="text-cardinal hover:underline">stanford.h.outreach@gmail.com</a>
            </p>
            <button
              onClick={() => { setStatus('idle'); setForm({ name: '', email: '', phone: '', studentType: '', smopFellow: false, languages: [], canDrive: false, hasBadgeAccess: false, isEventLead: false, shifts: [], notes: '' }); }}
              className="mt-6 text-sm text-cardinal font-semibold hover:underline"
            >
              Sign up for more shifts
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">About You</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text" required value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cardinal/30 focus:border-cardinal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email" required value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cardinal/30 focus:border-cardinal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cardinal/30 focus:border-cardinal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">I am a... *</label>
                  <select
                    required value={form.studentType}
                    onChange={e => setForm(f => ({ ...f, studentType: e.target.value, shifts: [] }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cardinal/30 focus:border-cardinal"
                  >
                    <option value="">Select...</option>
                    <option value="md">MD Student</option>
                    <option value="pa">PA Student</option>
                    <option value="undergrad">Undergraduate</option>
                    <option value="grad">Graduate Student</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox" checked={form.smopFellow}
                    onChange={e => setForm(f => ({ ...f, smopFellow: e.target.checked, shifts: [] }))}
                    className="accent-cardinal"
                  />
                  I am a SMOP Fellow
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Non-English languages spoken (check all that apply)</label>
                <div className="flex flex-wrap gap-3">
                  {['spanish', 'mandarin'].map(lang => (
                    <label key={lang} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox" checked={form.languages.includes(lang)}
                        onChange={() => handleLanguageToggle(lang)}
                        className="accent-cardinal"
                      />
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Logistics</h2>

              <div className="space-y-3">
                <div>
                  <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox" checked={form.canDrive}
                      onChange={e => setForm(f => ({ ...f, canDrive: e.target.checked, shifts: [] }))}
                      className="accent-cardinal mt-0.5"
                    />
                    <div>
                      <span className="font-medium">I can drive other volunteers to the site</span>
                      <p className="text-xs text-gray-500 mt-0.5">You must bring your own vehicle. We are very low on volunteer drivers and really need your help!</p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox" checked={form.hasBadgeAccess}
                      onChange={e => setForm(f => ({ ...f, hasBadgeAccess: e.target.checked }))}
                      className="accent-cardinal mt-0.5"
                    />
                    <div>
                      <span className="font-medium">I have badge access to the 4th floor of LKSC</span>
                      <p className="text-xs text-gray-500 mt-0.5">MD/PA students, REACH postbaccs, biosciences PhD and masters students typically have access. If you do, please bring your badge!</p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox" checked={form.isEventLead}
                      onChange={e => setForm(f => ({ ...f, isEventLead: e.target.checked }))}
                      className="accent-cardinal mt-0.5"
                    />
                    <div>
                      <span className="font-medium">I am signing up as the Event Lead</span>
                      <p className="text-xs text-red-600 mt-0.5">Only sign up for this if you have been specifically trained as an event lead. First come, first served.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {showMandarinNotice && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <HiInformationCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-amber-800">
                  Mandarin-speaking volunteers are placed at Hope's Corner in Mountain View, where many clients speak Mandarin. SMOP Fellows may volunteer at any site.
                </p>
              </div>
            )}

            {(form.studentType === 'md' || form.studentType === 'pa') && (
              <div className="flex items-start gap-3 bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
                <HiInformationCircle className="text-purple-600 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-purple-800">
                  MD and PA students are prioritized at Hope's Corner, Neighborhood Hands, and Sunnyvale. These sites benefit most from your clinical training. You can still sign up for other sites if available.
                </p>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Select Shifts</h2>
              <p className="text-xs text-gray-500 mb-3">
                Times shown are meet/return at Li Ka Shing Center (LKSC). Transportation to the site is provided.
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-100 rounded-lg p-3">
                {availableShifts.length === 0 && (
                  <p className="text-gray-500 text-sm italic py-4 text-center">No shifts available. Please check back soon.</p>
                )}
                {availableShifts.map((shift, i) => {
                  const tag = getSiteTag(shift, form);
                  const s = getShiftStatus(shift);
                  const full = isShiftFull(shift);
                  const slot = getSlotForUser(shift);
                  const hasEventLead = !!s.eventLead;

                  const hasPeople = (s.driverList && s.driverList.length > 0) || (s.nonDriverList && s.nonDriverList.length > 0);

                  return (
                    <div key={i} className={`rounded px-2 py-2 ${full && !form.shifts.includes(i) ? 'opacity-50' : 'hover:bg-gray-50'}`}>
                      <label className={`flex items-start gap-2 text-sm text-gray-700 ${full && !form.shifts.includes(i) ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox" checked={form.shifts.includes(i)}
                          onChange={() => handleShiftToggle(i)}
                          disabled={full && !form.shifts.includes(i)}
                          className="accent-cardinal mt-0.5"
                        />
                        <div className="flex-1">
                          <div>
                            <span className="font-medium">{shift.date}</span> — {shift.site}
                            {tag && (
                              <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${tag.color}`}>{tag.text}</span>
                            )}
                            {full && (
                              <span className="ml-2 text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Full</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">LKSC {shift.time} · {shift.address}</div>
                          <div className="flex flex-wrap gap-3 mt-1">
                            <span className={`text-xs ${s.drivers >= s.capDrivers ? 'text-orange-600' : 'text-gray-400'}`}>
                              Drivers: {s.drivers}/{s.capDrivers}
                            </span>
                            <span className={`text-xs ${s.nonDrivers >= s.capNonDrivers ? 'text-orange-600' : 'text-gray-400'}`}>
                              Non-drivers: {s.nonDrivers}/{s.capNonDrivers}
                            </span>
                            {hasEventLead ? (
                              <span className="text-xs text-green-700">{s.eventLead} is the event lead</span>
                            ) : (
                              <span className="text-xs text-gray-400">Event lead: open</span>
                            )}
                            {s.badgeHolders && s.badgeHolders.length > 0 && (
                              <span className="text-xs text-indigo-600">Badge: {s.badgeHolders.join(', ')}</span>
                            )}
                          </div>
                          {(hasPeople || (s.clinicians && s.clinicians.length > 0)) && (
                            <div className="mt-1.5 text-xs text-gray-500 border-t border-gray-100 pt-1.5 space-y-0.5">
                              {s.driverList && s.driverList.length > 0 && (
                                <div>
                                  <span className="font-medium text-gray-600">Drivers:</span>{' '}
                                  {s.driverList.map((p, j) => (
                                    <span key={j}>{p.name}{p.phone ? ` (${p.phone})` : ''}{j < s.driverList.length - 1 ? ', ' : ''}</span>
                                  ))}
                                </div>
                              )}
                              {s.nonDriverList && s.nonDriverList.length > 0 && (
                                <div>
                                  <span className="font-medium text-gray-600">Non-drivers:</span>{' '}
                                  {s.nonDriverList.map((p, j) => (
                                    <span key={j}>{p.name}{p.phone ? ` (${p.phone})` : ''}{j < s.nonDriverList.length - 1 ? ', ' : ''}</span>
                                  ))}
                                </div>
                              )}
                              {s.clinicians && s.clinicians.length > 0 && (
                                <div>
                                  <span className="font-medium text-green-700">Clinician:</span>{' '}
                                  {s.clinicians.map((c, j) => (
                                    <span key={j} className="text-green-700">{c.name}{c.role ? ` (${c.role})` : ''}{c.phone ? ` — ${c.phone}` : ''}{j < s.clinicians.length - 1 ? ', ' : ''}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={form.notes} rows={2}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cardinal/30 focus:border-cardinal"
                placeholder="Anything else we should know? (e.g. other languages, affiliations)"
              />
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg text-sm">
                <HiExclamationCircle size={18} />
                Something went wrong. Please try again or email stanford.h.outreach@gmail.com.
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'submitting' || form.shifts.length === 0}
              className="w-full bg-cardinal text-white py-3 rounded-lg font-semibold hover:bg-cardinal-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'submitting' ? 'Submitting...' : `Sign Up for ${form.shifts.length} Shift${form.shifts.length !== 1 ? 's' : ''}`}
            </button>

            <p className="text-center text-xs text-gray-400">
              Stanford Medicine Outreach Program
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
