import { useState, useMemo, useEffect } from 'react';
import { HiCheckCircle, HiExclamationCircle, HiInformationCircle } from 'react-icons/hi';

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

const PRE_ASSESSMENT_QUESTIONS = [
  { id: 'pre_confidence', label: 'How confident do you feel in your ability to interact with patients in a clinical outreach setting?', type: 'scale' },
];

const POST_ASSESSMENT_QUESTIONS = [
  { id: 'post_confidence', label: 'After this shift, how confident do you feel in your ability to interact with patients in a clinical outreach setting?', type: 'scale' },
];

function PostAssessment() {
  const params = new URLSearchParams(window.location.search);
  const email = params.get('email') || '';
  const shift = params.get('shift') || '';
  const name = params.get('name') || '';
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ type: 'post-assessment', email, name, shift, answers }),
      });
      const result = await res.json();
      if (result.status === 'ok') setStatus('success');
      else setStatus('error');
    } catch { setStatus('error'); }
  };

  if (status === 'success') {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-gradient-to-br from-cardinal to-cardinal-dark text-white py-12">
          <div className="max-w-2xl mx-auto px-4">
            <h1 className="text-3xl font-bold mb-2">Stanford Medicine Outreach Program</h1>
            <p className="text-white/80">Post-Shift Assessment</p>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <HiCheckCircle className="mx-auto text-green-600 mb-3" size={48} />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Thank you!</h2>
            <p className="text-gray-600 text-sm">Your post-shift assessment has been submitted. We appreciate your feedback!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-br from-cardinal to-cardinal-dark text-white py-12">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Stanford Medicine Outreach Program</h1>
          <p className="text-white/80">Post-Shift Assessment</p>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">How was your shift?</h2>
            <p className="text-sm text-gray-500">{shift}</p>
            {POST_ASSESSMENT_QUESTIONS.map(q => (
              <div key={q.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">{q.label}</label>
                {q.type === 'scale' && (
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button"
                        onClick={() => setAnswers(a => ({ ...a, [q.id]: n }))}
                        className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${answers[q.id] === n ? 'bg-cardinal text-white border-cardinal' : 'border-gray-200 text-gray-600 hover:border-cardinal/50'}`}
                      >{n}</button>
                    ))}
                  </div>
                )}
                {q.type === 'text' && (
                  <textarea value={answers[q.id] || ''} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cardinal/30 focus:border-cardinal" rows={3} />
                )}
              </div>
            ))}
            <p className="text-xs text-gray-400">1 = Not confident at all, 5 = Very confident</p>
          </div>
          <button type="submit" disabled={status === 'submitting' || Object.keys(answers).length === 0}
            className="w-full bg-cardinal hover:bg-cardinal-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
            {status === 'submitting' ? 'Submitting...' : 'Submit Assessment'}
          </button>
          {status === 'error' && <p className="text-red-600 text-sm text-center">Something went wrong. Please try again.</p>}
        </form>
      </div>
    </div>
  );
}

const STUDENT_TYPE_LABELS = { md: 'MD Student', pa: 'PA Student', undergrad: 'Undergrad', grad: 'Grad Student', other: 'Other' };

const allShifts = [
  { date: 'Saturday, June 27', startDateTime: '2026-06-27T07:30:00', time: '7:30 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Saturday, June 27', startDateTime: '2026-06-27T10:45:00', time: '10:45 am – 1:30 pm', site: 'Helping Hands at Sunnyvale Public Library', address: '665 W Olive Ave, Sunnyvale, CA 94086' },
  { date: 'Sunday, June 28', startDateTime: '2026-06-28T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Saturday, July 11', startDateTime: '2026-07-11T07:00:00', time: '7:00 – 10:30 am', site: "Hope's Corner", address: '748 Mercy St, Mountain View, CA 94041' },
  { date: 'Saturday, July 11', startDateTime: '2026-07-11T07:30:00', time: '7:30 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Sunday, July 12', startDateTime: '2026-07-12T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Tuesday, July 14', startDateTime: '2026-07-14T17:15:00', time: '5:15 – 7:45 pm', site: 'WeHOPE', address: '1854 Bay Road, East Palo Alto, CA 94303' },
  { date: 'Saturday, July 25', startDateTime: '2026-07-25T07:30:00', time: '7:30 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Saturday, July 25', startDateTime: '2026-07-25T10:45:00', time: '10:45 am – 1:30 pm', site: 'Helping Hands at Sunnyvale Public Library', address: '665 W Olive Ave, Sunnyvale, CA 94086' },
  { date: 'Sunday, July 26', startDateTime: '2026-07-26T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Saturday, August 8', startDateTime: '2026-08-08T07:00:00', time: '7:00 – 10:30 am', site: "Hope's Corner", address: '748 Mercy St, Mountain View, CA 94041' },
  { date: 'Saturday, August 8', startDateTime: '2026-08-08T07:30:00', time: '7:30 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Sunday, August 9', startDateTime: '2026-08-09T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Tuesday, August 11', startDateTime: '2026-08-11T17:15:00', time: '5:15 – 7:45 pm', site: 'WeHOPE', address: '1854 Bay Road, East Palo Alto, CA 94303' },
  { date: 'Saturday, August 22', startDateTime: '2026-08-22T07:30:00', time: '7:30 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Sunday, August 23', startDateTime: '2026-08-23T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Saturday, August 29', startDateTime: '2026-08-29T10:45:00', time: '10:45 am – 1:30 pm', site: 'Helping Hands at Sunnyvale Public Library', address: '665 W Olive Ave, Sunnyvale, CA 94086' },
  { date: 'Saturday, September 5', startDateTime: '2026-09-05T07:30:00', time: '7:30 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Sunday, September 6', startDateTime: '2026-09-06T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Tuesday, September 8', startDateTime: '2026-09-08T17:15:00', time: '5:15 – 7:45 pm', site: 'WeHOPE', address: '1854 Bay Road, East Palo Alto, CA 94303' },
  { date: 'Saturday, September 12', startDateTime: '2026-09-12T07:00:00', time: '7:00 – 10:30 am', site: "Hope's Corner", address: '748 Mercy St, Mountain View, CA 94041' },
  { date: 'Saturday, September 19', startDateTime: '2026-09-19T07:30:00', time: '7:30 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Sunday, September 20', startDateTime: '2026-09-20T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Saturday, September 26', startDateTime: '2026-09-26T10:45:00', time: '10:45 am – 1:30 pm', site: 'Helping Hands at Sunnyvale Public Library', address: '665 W Olive Ave, Sunnyvale, CA 94086' },
  { date: 'Saturday, October 3', startDateTime: '2026-10-03T07:30:00', time: '7:30 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Sunday, October 4', startDateTime: '2026-10-04T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Saturday, October 10', startDateTime: '2026-10-10T07:00:00', time: '7:00 – 10:30 am', site: "Hope's Corner", address: '748 Mercy St, Mountain View, CA 94041' },
  { date: 'Tuesday, October 13', startDateTime: '2026-10-13T17:15:00', time: '5:15 – 7:45 pm', site: 'WeHOPE', address: '1854 Bay Road, East Palo Alto, CA 94303' },
  { date: 'Wednesday, October 14', startDateTime: '2026-10-14T09:30:00', time: '9:30 am – 12:30 pm', site: 'Peninsula Healthcare Connections', address: 'The Opportunity Center, 33 Encina Ave, Palo Alto, CA 94301' },
  { date: 'Saturday, October 17', startDateTime: '2026-10-17T07:30:00', time: '7:30 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Sunday, October 18', startDateTime: '2026-10-18T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Wednesday, October 28', startDateTime: '2026-10-28T09:30:00', time: '9:30 am – 12:30 pm', site: 'Peninsula Healthcare Connections', address: 'The Opportunity Center, 33 Encina Ave, Palo Alto, CA 94301' },
  { date: 'Sunday, October 25', startDateTime: '2026-10-25T11:30:00', time: '11:30 am – 2:00 pm', site: 'Family Community Church Fall Fest', address: '478 Piercy Road, San Jose, CA 95138' },
  { date: 'Saturday, October 31', startDateTime: '2026-10-31T07:30:00', time: '7:30 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Saturday, October 31', startDateTime: '2026-10-31T10:45:00', time: '10:45 am – 1:30 pm', site: 'Helping Hands at Sunnyvale Public Library', address: '665 W Olive Ave, Sunnyvale, CA 94086' },
  { date: 'Sunday, November 1', startDateTime: '2026-11-01T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Sunday, November 8', startDateTime: '2026-11-08T09:40:00', time: '9:40 am – 1:15 pm', site: 'WeHOPE Berryessa Safe RV Parking', address: '1300 Berryessa Rd, San Jose, CA 95133' },
  { date: 'Tuesday, November 10', startDateTime: '2026-11-10T17:15:00', time: '5:15 – 7:45 pm', site: 'WeHOPE', address: '1854 Bay Road, East Palo Alto, CA 94303' },
  { date: 'Saturday, November 14', startDateTime: '2026-11-14T07:00:00', time: '7:00 – 10:30 am', site: "Hope's Corner", address: '748 Mercy St, Mountain View, CA 94041' },
  { date: 'Saturday, November 14', startDateTime: '2026-11-14T07:30:00', time: '7:30 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Sunday, November 15', startDateTime: '2026-11-15T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Saturday, November 28', startDateTime: '2026-11-28T07:30:00', time: '7:30 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Saturday, November 28', startDateTime: '2026-11-28T10:45:00', time: '10:45 am – 1:30 pm', site: 'Helping Hands at Sunnyvale Public Library', address: '665 W Olive Ave, Sunnyvale, CA 94086' },
  { date: 'Sunday, November 29', startDateTime: '2026-11-29T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Sunday, December 6', startDateTime: '2026-12-06T09:40:00', time: '9:40 am – 1:15 pm', site: 'WeHOPE Berryessa Safe RV Parking', address: '1300 Berryessa Rd, San Jose, CA 95133' },
  { date: 'Tuesday, December 8', startDateTime: '2026-12-08T17:15:00', time: '5:15 – 7:45 pm', site: 'WeHOPE', address: '1854 Bay Road, East Palo Alto, CA 94303' },
  { date: 'Saturday, December 12', startDateTime: '2026-12-12T07:00:00', time: '7:00 – 10:30 am', site: "Hope's Corner", address: '748 Mercy St, Mountain View, CA 94041' },
  { date: 'Saturday, December 12', startDateTime: '2026-12-12T07:30:00', time: '7:30 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Sunday, December 13', startDateTime: '2026-12-13T09:40:00', time: '9:40 am – 1:15 pm', site: 'Hope for the Unhoused', address: '1432 S Main St, Milpitas, CA 95035' },
  { date: 'Saturday, December 26', startDateTime: '2026-12-26T07:30:00', time: '7:30 – 10:45 am', site: 'Neighborhood Hands', address: '500 Coleman Ave, San Jose, CA 95110' },
  { date: 'Saturday, December 26', startDateTime: '2026-12-26T10:45:00', time: '10:45 am – 1:30 pm', site: 'Helping Hands at Sunnyvale Public Library', address: '665 W Olive Ave, Sunnyvale, CA 94086' },
];

const SITE_CAPACITY = {
  "Hope's Corner": { drivers: 2, nonDrivers: 4 },
  "Neighborhood Hands": { drivers: 3, nonDrivers: 4 },
  "Helping Hands at Sunnyvale Public Library": { drivers: 3, nonDrivers: 4 },
  "Hope for the Unhoused": { drivers: 3, nonDrivers: 4 },
  "WeHOPE": { drivers: 2, nonDrivers: 4 },
  "Peninsula Healthcare Connections": { drivers: 0, nonDrivers: 4 },
  "Family Community Church Fall Fest": { drivers: 2, nonDrivers: 4, driverRatio: 2 },
  "WeHOPE Berryessa Safe RV Parking": { drivers: 3, nonDrivers: 4 },
};

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

function formatShiftDetails(shift) {
  const parts = shift.time.split(/\s*[–\-]+\s*/);
  let meetTime = (parts[0] || '').trim();
  const returnTime = (parts[1] || '').trim();
  if (!/am|pm/i.test(meetTime)) {
    const suffix = returnTime.match(/(am|pm)/i);
    if (suffix) meetTime += ' ' + suffix[1];
  }
  if (shift.site === 'Peninsula Healthcare Connections') {
    return `Meet at The Opportunity Center (33 Encina Ave, Palo Alto — next to Trader Joe's near campus) at ${meetTime}. We are joining Peninsula Healthcare Connections to walk around Palo Alto and speak to community members about mobile healthcare needs. Event ends at ${returnTime}.`;
  }
  if (shift.site === 'Family Community Church Fall Fest') {
    return `Meet at LKSC at ${meetTime}. We will drive to Family Community Church at ${shift.address} to share health and wellness information at their Family Fall Fest. Event ends at ${returnTime}.`;
  }
  return `Meet at LKSC at ${meetTime}. Return to LKSC at ${returnTime}. We depart and return as a team to and from LKSC. The event is located at ${shift.address}.`;
}

const SAVED_FIELDS = ['name', 'email', 'phone', 'studentType', 'smopFellow', 'languages', 'canDrive', 'hasBadgeAccess', 'isEventLead'];
const STORAGE_KEY = 'smop-volunteer-info';

function loadSavedInfo() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) return saved;
  } catch {}
  return null;
}

function saveInfo(form) {
  const toSave = {};
  SAVED_FIELDS.forEach(k => { toSave[k] = form[k]; });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

export default function VolunteerSignUp() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('view') === 'post-assessment') return <PostAssessment />;

  const [form, setForm] = useState(() => {
    const defaults = {
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
      preAssessment: {},
    };
    const saved = loadSavedInfo();
    return saved ? { ...defaults, ...saved, shifts: [], notes: '', preAssessment: {} } : defaults;
  });
  const [status, setStatus] = useState('idle');
  const [capacityError, setCapacityError] = useState('');
  const [shiftData, setShiftData] = useState({});
  const [isFirstTime, setIsFirstTime] = useState(null);

  useEffect(() => {
    if (!SCRIPT_URL) return;
    fetch(`${SCRIPT_URL}?type=volunteer-counts`)
      .then(res => res.json())
      .then(data => setShiftData(data.shifts || {}))
      .catch(() => {});
  }, []);

  const now = Date.now();
  const futureShifts = allShifts.filter(s => new Date(s.startDateTime).getTime() > now);
  const pastShifts = allShifts.filter(s => new Date(s.startDateTime).getTime() <= now);
  const [showPast, setShowPast] = useState(false);
  const [showCoordinator, setShowCoordinator] = useState(false);
  const [removing, setRemoving] = useState(null);

  const handleRemoveVolunteer = async (name, shiftDate, shiftSite, type = 'remove-volunteer') => {
    if (!confirm(`Remove ${name} from ${shiftDate} — ${shiftSite}?`)) return;
    const key = `${name}|${shiftDate}|${shiftSite}`;
    setRemoving(key);
    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ type, name, shiftDate, shiftSite }),
      });
      const result = await res.json();
      if (result.status === 'ok') {
        const refreshRes = await fetch(`${SCRIPT_URL}?type=volunteer-counts`);
        const refreshData = await refreshRes.json();
        setShiftData(refreshData.shifts || {});
      } else {
        alert(result.message || 'Failed to remove volunteer');
      }
    } catch {
      alert('Failed to remove volunteer. Please try again.');
    }
    setRemoving(null);
  };

  const availableShifts = useMemo(() => {
    return futureShifts
      .filter(shift => isShiftAllowed(shift, form));
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

  const MANUAL_ADDITIONS = [
    { date: 'Saturday, August 22', site: 'Neighborhood Hands', person: { name: 'Tony Menacho', email: '', phone: '(909) 730-5241', studentType: '', languages: '' }, isDriver: false },
  ];

  function getShiftStatus(shift) {
    const key = shiftKey(shift);
    const data = shiftData[key] || { drivers: 0, nonDrivers: 0, eventLead: '' };
    const merged = { ...data, driverList: [...(data.driverList || [])], nonDriverList: [...(data.nonDriverList || [])], badgeHolders: [...(data.badgeHolders || [])] };
    MANUAL_ADDITIONS.forEach(ma => {
      if (ma.date === shift.date && ma.site === shift.site) {
        if (ma.isDriver) {
          merged.drivers++;
          merged.driverList.push(ma.person);
        } else {
          merged.nonDrivers++;
          merged.nonDriverList.push(ma.person);
        }
      }
    });
    const cap = SITE_CAPACITY[shift.site] || { drivers: 3, nonDrivers: 4 };
    const effectiveNonDriverCap = cap.driverRatio ? Math.min(cap.nonDrivers, merged.drivers * cap.driverRatio) : cap.nonDrivers;
    return { ...merged, capDrivers: cap.drivers, capNonDrivers: cap.nonDrivers, effectiveNonDriverCap };
  }

  function getUserNonDriverCap(shift) {
    const s = getShiftStatus(shift);
    const isMdPa = form.studentType === 'md' || form.studentType === 'pa';
    if (!isMdPa) {
      const mdPaCount = s.mdPaCount || 0;
      const reserved = Math.max(0, 2 - mdPaCount);
      return Math.max(0, s.effectiveNonDriverCap - reserved);
    }
    return s.effectiveNonDriverCap;
  }

  function isShiftFull(shift) {
    const s = getShiftStatus(shift);
    const cap = getUserNonDriverCap(shift);
    const normallyFull = form.canDrive
      ? s.drivers >= s.capDrivers && s.nonDrivers >= cap
      : s.nonDrivers >= cap;
    if (normallyFull && form.languages.includes('mandarin') && shift.site === MANDARIN_ONLY_SITE && !(s.mandarinCount > 0)) {
      return false;
    }
    return normallyFull;
  }

  function getSlotForUser(shift) {
    const s = getShiftStatus(shift);
    const cap = getUserNonDriverCap(shift);
    if (form.canDrive && s.drivers < s.capDrivers) return 'driver';
    if (s.nonDrivers < cap) return 'non-driver';
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setCapacityError('');
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
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
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
          preAssessment: isFirstTime ? form.preAssessment : undefined,
        }),
      });
      const result = await res.json();
      if (result.status === 'error') {
        setCapacityError(result.message);
        setStatus('idle');
      } else {
        saveInfo(form);
        setStatus('success');
      }
    } catch {
      setStatus('error');
    }
  };

  const showMandarinNotice = form.languages.includes('mandarin') && !form.smopFellow;

  return (
    <div className="bg-gray-50">
      <div className="bg-gradient-to-br from-cardinal to-cardinal-dark text-white py-12">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Stanford Medicine Outreach Program</h1>
          <p className="text-white/80">Volunteer Sign-Up</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-4">
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 text-center">
          <p className="text-yellow-900 font-bold text-lg">Sign-ups close the Thursday before the event at noon!</p>
          <p className="text-yellow-800 text-sm mt-1">Please do not sign up later than that, as our volunteer coordinator sends out volunteer info on Thursday afternoons/evenings and it is a lot of added work for our coordinator to get you caught up to speed if you are added later.</p>
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
              Need to cancel a shift? Email SMOP volunteer coordinator <a href="mailto:lauratjy@stanford.edu" className="text-cardinal hover:underline">lauratjy@stanford.edu</a>.
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
                    onBlur={() => {
                      if (!form.email || !SCRIPT_URL) return;
                      fetch(`${SCRIPT_URL}?type=check-email&email=${encodeURIComponent(form.email)}`)
                        .then(r => r.json())
                        .then(d => setIsFirstTime(!d.exists))
                        .catch(() => setIsFirstTime(null));
                    }}
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
                  I am a SMOP Fellow or SMOP Officer
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

            {form.studentType && form.studentType !== 'md' && form.studentType !== 'pa' && (
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <HiInformationCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-blue-800">
                  Non-MD/PA students are limited to 8 shifts per quarter to ensure fair access for all volunteers.
                </p>
              </div>
            )}

            {isFirstTime === true && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
                <h2 className="text-lg font-semibold text-gray-800">Pre-Volunteer Assessment</h2>
                <p className="text-xs text-gray-500">Since this is your first time volunteering with SMOP, please answer the following.</p>
                {PRE_ASSESSMENT_QUESTIONS.map(q => (
                  <div key={q.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{q.label}</label>
                    {q.type === 'scale' && (
                      <div>
                        <div className="flex gap-2">
                          {[1,2,3,4,5].map(n => (
                            <button key={n} type="button"
                              onClick={() => setForm(f => ({ ...f, preAssessment: { ...f.preAssessment, [q.id]: n } }))}
                              className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${form.preAssessment[q.id] === n ? 'bg-cardinal text-white border-cardinal' : 'border-gray-200 text-gray-600 hover:border-cardinal/50'}`}
                            >{n}</button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">1 = Not confident at all, 5 = Very confident</p>
                      </div>
                    )}
                    {q.type === 'text' && (
                      <textarea value={form.preAssessment[q.id] || ''} onChange={e => setForm(f => ({ ...f, preAssessment: { ...f.preAssessment, [q.id]: e.target.value } }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cardinal/30 focus:border-cardinal" rows={3} />
                    )}
                  </div>
                ))}
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
                  if (isShiftFull(shift) && !form.shifts.includes(i)) return null;
                  const tag = getSiteTag(shift, form);
                  const s = getShiftStatus(shift);
                  const slot = getSlotForUser(shift);

                  const hasPeople = (s.driverList && s.driverList.length > 0) || (s.nonDriverList && s.nonDriverList.length > 0);

                  const userNonDriverCap = getUserNonDriverCap(shift);
                  const effectiveTotal = s.capDrivers + userNonDriverCap;
                  const filled = s.drivers + s.nonDrivers;

                  return (
                    <div key={i} className="rounded px-2 py-2 hover:bg-gray-50">
                      <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox" checked={form.shifts.includes(i)}
                          onChange={() => handleShiftToggle(i)}
                          className="accent-cardinal mt-0.5"
                        />
                        <div className="flex-1">
                          <div>
                            <span className="font-medium">{shift.date}</span> — {shift.site}
                            {tag && (
                              <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${tag.color}`}>{tag.text}</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{formatShiftDetails(shift)}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            Spots: {filled}/{effectiveTotal} filled
                            {userNonDriverCap < s.effectiveNonDriverCap && (
                              <span className="text-purple-600 font-semibold"> ({s.effectiveNonDriverCap - userNonDriverCap} spot{s.effectiveNonDriverCap - userNonDriverCap !== 1 ? 's' : ''} reserved for MD/PA)</span>
                            )}
                          </div>
                          {(hasPeople || (s.clinicians && s.clinicians.length > 0)) && (
                            <div className="mt-1.5 text-xs text-gray-500 border-t border-gray-100 pt-1.5 space-y-0.5">
                              <div>
                                <span className="font-medium text-gray-600">Signed up:</span>{' '}
                                {[...(s.driverList || []), ...(s.nonDriverList || [])].map((p, j, arr) => (
                                  <span key={j}>{p.name}{j < arr.length - 1 ? ', ' : ''}</span>
                                ))}
                              </div>
                              {s.clinicians && s.clinicians.length > 0 && (
                                <div>
                                  <span className="font-medium text-green-700">Clinician:</span>{' '}
                                  {s.clinicians.map((c, j) => (
                                    <span key={j} className="text-green-700">{c.name}{j < s.clinicians.length - 1 ? ', ' : ''}</span>
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <button
                type="button"
                onClick={() => setShowCoordinator(!showCoordinator)}
                className="text-sm text-gray-700 hover:text-gray-900 font-semibold flex items-center gap-2 w-full"
              >
                {showCoordinator ? '▾' : '▸'} Coordinator / Event Lead View
              </button>
              {showCoordinator && (
                <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 max-h-96 overflow-y-auto">
                  {futureShifts.map((shift, i) => {
                    const s = getShiftStatus(shift);
                    const hasPeople = (s.driverList && s.driverList.length > 0) || (s.nonDriverList && s.nonDriverList.length > 0);
                    if (!hasPeople && !(s.clinicians && s.clinicians.length > 0)) return null;
                    return (
                      <div key={i} className="bg-white rounded-lg border border-gray-100 p-3">
                        <div className="text-sm font-medium text-gray-800">{shift.date} — {shift.site}</div>
                        <div className="text-xs text-gray-500">{formatShiftDetails(shift)}</div>
                        <div className="flex flex-wrap gap-3 mt-1">
                          <span className={`text-xs ${s.drivers >= s.capDrivers ? 'text-orange-600' : 'text-gray-400'}`}>
                            Drivers: {s.drivers}/{s.capDrivers}
                          </span>
                          <span className={`text-xs ${s.nonDrivers >= s.effectiveNonDriverCap ? 'text-orange-600' : 'text-gray-400'}`}>
                            Non-drivers: {s.nonDrivers}/{s.effectiveNonDriverCap}
                          </span>
                          {s.eventLead ? (
                            <span className="text-xs text-green-700">{s.eventLead} is the event lead</span>
                          ) : (
                            <span className="text-xs text-gray-400">Event lead: open</span>
                          )}
                          {s.badgeHolders && s.badgeHolders.length > 0 ? (
                            <span className="text-xs text-indigo-600">Badge: {s.badgeHolders.join(', ')}</span>
                          ) : (s.drivers + s.nonDrivers) > 0 ? (
                            <span className="text-xs font-bold text-red-600">⚠ NO BADGE ACCESS — must be resolved before event day</span>
                          ) : null}
                        </div>
                        <div className="mt-1.5 text-xs text-gray-500 border-t border-gray-100 pt-1.5 space-y-0.5">
                          {s.driverList && s.driverList.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-600">Drivers:</span>{' '}
                              {s.driverList.map((p, j) => {
                                const rmKey = `${p.name}|${shift.date}|${shift.site}`;
                                return (
                                  <span key={j}>
                                    {p.name}{p.studentType ? ` [${STUDENT_TYPE_LABELS[p.studentType] || p.studentType}]` : ''}{p.languages ? ` {${p.languages}}` : ''}{p.email ? ` ${p.email}` : ''}{p.phone ? ` (${p.phone})` : ''}
                                    <button type="button" onClick={() => handleRemoveVolunteer(p.name, shift.date, shift.site)} disabled={removing === rmKey} className="ml-1 text-red-400 hover:text-red-600 font-bold" title={`Remove ${p.name}`}>{removing === rmKey ? '...' : '✕'}</button>
                                    {j < s.driverList.length - 1 ? ', ' : ''}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          {s.nonDriverList && s.nonDriverList.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-600">Non-drivers:</span>{' '}
                              {s.nonDriverList.map((p, j) => {
                                const rmKey = `${p.name}|${shift.date}|${shift.site}`;
                                return (
                                  <span key={j}>
                                    {p.name}{p.studentType ? ` [${STUDENT_TYPE_LABELS[p.studentType] || p.studentType}]` : ''}{p.languages ? ` {${p.languages}}` : ''}{p.email ? ` ${p.email}` : ''}{p.phone ? ` (${p.phone})` : ''}
                                    <button type="button" onClick={() => handleRemoveVolunteer(p.name, shift.date, shift.site)} disabled={removing === rmKey} className="ml-1 text-red-400 hover:text-red-600 font-bold" title={`Remove ${p.name}`}>{removing === rmKey ? '...' : '✕'}</button>
                                    {j < s.nonDriverList.length - 1 ? ', ' : ''}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          {s.clinicians && s.clinicians.length > 0 && (
                            <div>
                              <span className="font-medium text-green-700">Clinician:</span>{' '}
                              {s.clinicians.map((c, j) => {
                                const rmKey = `${c.name}|${shift.date}|${shift.site}`;
                                return (
                                  <span key={j} className="text-green-700">
                                    {c.name}{c.role ? ` (${c.role})` : ''}{c.phone ? ` — ${c.phone}` : ''}
                                    <button type="button" onClick={() => handleRemoveVolunteer(c.name, shift.date, shift.site, 'remove-clinician')} disabled={removing === rmKey} className="ml-1 text-red-400 hover:text-red-600 font-bold" title={`Remove ${c.name}`}>{removing === rmKey ? '...' : '✕'}</button>
                                    {j < s.clinicians.length - 1 ? ', ' : ''}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        {(s.driverList?.length > 0 || s.nonDriverList?.length > 0) && (() => {
                          const allPeople = [...(s.driverList || []), ...(s.nonDriverList || [])];
                          const phoneList = allPeople.filter(p => p.phone).map(p => p.phone).join('\n');
                          if (!phoneList) return null;
                          return (
                            <div className="mt-1.5 border-t border-gray-100 pt-1.5">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-600">Phone Numbers (for group chat)</span>
                                <button
                                  type="button"
                                  onClick={() => { navigator.clipboard.writeText(phoneList); }}
                                  className="text-xs text-cardinal hover:text-cardinal-dark font-medium px-2 py-0.5 rounded border border-cardinal/30 hover:bg-cardinal/5"
                                >
                                  Copy Phones
                                </button>
                              </div>
                              <pre className="text-xs text-gray-500 whitespace-pre-wrap bg-gray-50 rounded p-2">{phoneList}</pre>
                            </div>
                          );
                        })()}
                        {(s.driverList?.length > 0 || s.nonDriverList?.length > 0) && (() => {
                          const eventLeadName = s.eventLead || '[EVENT LEAD NAME]';
                          const allPeople = [...(s.driverList || []), ...(s.nonDriverList || [])];
                          const eventLeadPerson = allPeople.find(p => p.name === s.eventLead);
                          const eventLeadPhone = eventLeadPerson?.phone || '[PHONE]';
                          const driverNames = (s.driverList || []).map(p => p.name).join(', ') || '[NO DRIVERS]';
                          const badgeNames = (s.badgeHolders || []).join(', ') || '[NO BADGE HOLDERS]';
                          const meetMatch = shift.time.split(/\s*[–\-]+\s*/);
                          let meetTime = (meetMatch[0] || '').trim();
                          if (!/am|pm/i.test(meetTime)) {
                            const suffix = (meetMatch[1] || '').match(/(am|pm)/i);
                            if (suffix) meetTime += ' ' + suffix[1];
                          }
                          const eventDay = shift.date.split(',')[0];
                          const driverInstructions = {
                            "Hope's Corner": `Drivers, the location to drive to is Hope's Corner: 748 Mercy St, Mountain View, CA 94041. Park anywhere in the parking lot.`,
                            "Neighborhood Hands": `Drivers: The location is the 500 Coleman Ave, San Jose, CA 95110 United States. Please unload supplies and riders there, and then go park. Free parking is available across the street in the mall plaza at 543 Coleman Ave, San Jose, CA 95110.`,
                            "Hope for the Unhoused": `Drivers: The location is 1432 S Main St, Milpitas, CA 95035 and parking is in the lot right next to it at 1480 Main St.`,
                            "WeHOPE": `Drivers, the location to drive to is WeHOPE: 1854 Bay Road, East Palo Alto, CA 94303`,
                            "Helping Hands at Sunnyvale Public Library": `Drivers, the location to drive to is Sunnyvale Public Library, 665 W Olive Ave`,
                            "Family Community Church Fall Fest": `Drivers, the location to drive to is Family Community Church: 478 Piercy Road, San Jose, CA 95138`,
                            "WeHOPE Berryessa Safe RV Parking": `Drivers, the location to drive to is WeHOPE Berryessa Safe RV Parking: 1300 Berryessa Rd, San Jose, CA 95133`,
                          };
                          const driverInfo = driverInstructions[shift.site] || `Drivers, the location to drive to is ${shift.address}.`;
                          const script = `Hey everyone! I'm Laura, volunteer coordinator of SMOP. I won't be at the volunteer outreach event this ${eventDay}, but the event lead is ${eventLeadName} (${eventLeadPhone}) in this group chat. Thanks so much for volunteering with us!\n\n${driverNames} please park in the handicap spots closest to LK so we can load the cars with supplies - put your hazards on to prevent getting a ticket. Once we load up the cars and volunteers:\n\n${driverInfo}\n\n${badgeNames} - you have signed up for badge access to LKSC. Please make sure you bring your badge so that we have access to our supplies. If you cancel your shift, please make sure the volunteer coordinator is aware because we cannot access supplies without a badge.\n\nAll, please arrive at LK by ${meetTime}. We will load up cars from LK.\n\nDress code: Stanford Med or Stanford shirt (SMOP Shirt if you have one); casual but appropriate pants; closed-toed shoes.\n\nTo do on the car-ride there:\n\n1. Please review this Google Form that must be filled out for EVERY client we serve– this information must be reported to the Santa Clara Health Department and other funders to continue receiving donations. Not filling out this form for all clients really hurts our program.\nhttps://docs.google.com/forms/d/e/1FAIpQLSdYhnQ-mjQflrueQGOLF82aiJUQ6H8Gz3Mxuv0zZD4c-dI71w/viewform?usp=dialog\n\n2. Watch the below trainings (on x2 speed)\nhttps://drive.google.com/file/d/1bUnQ-kZso7s_hqsehG9G7k5m5pWyiLaX/view?usp=sharing\nhttps://drive.google.com/file/d/1Dfl8FcfNY7rQzZLzLYvsiEBHvlaJx_Gg/view?usp=sharing\n\nWhen you arrive: Text when you arrive! If you have badge access, head up to 4th floor and retrieve supplies for respective location. If you don't, go to LK outside stairs until someone lets you in.\n\nFailure to alert us of cancellations by the end of today will result in being unable to volunteer for the remainder of the quarter.\n\nAny special notes for today: \n\nPlease be sure to take the laminated "Where to get help" sheets that are hanging by our supplies on the fourth floor.`;
                          return (
                            <div className="mt-2 border-t border-gray-100 pt-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-600">Volunteer Coordinator Script</span>
                                <button
                                  type="button"
                                  onClick={() => { navigator.clipboard.writeText(script); }}
                                  className="text-xs text-cardinal hover:text-cardinal-dark font-medium px-2 py-0.5 rounded border border-cardinal/30 hover:bg-cardinal/5"
                                >
                                  Copy Script
                                </button>
                              </div>
                              <pre className="text-xs text-gray-500 whitespace-pre-wrap bg-gray-50 rounded p-2 max-h-40 overflow-y-auto">{script}</pre>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              )}
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

            {capacityError && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg text-sm">
                <HiExclamationCircle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Shift is full</p>
                  <p>{capacityError}</p>
                  <p className="mt-1 text-xs text-red-500">Please refresh the page and try a different shift.</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg text-sm">
                <HiExclamationCircle size={18} />
                Something went wrong. Please try again or email lauratjy@stanford.edu.
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

        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Non-Medical Volunteering with Our SMOP Community Partners</h2>
          <p className="text-sm text-gray-500 mb-4">Additional volunteer opportunities through organizations we partner with.</p>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-md font-semibold text-gray-800">Peninsula Healthcare Connection — Downtown Food Closet</h3>
            <p className="text-xs text-gray-500 mt-1">Palo Alto · Wednesdays, Thursdays, and Fridays</p>

            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">Morning Shift</div>
                  <div className="text-xs text-gray-500">10:00 AM – 12:00 PM</div>
                </div>
                <a
                  href="https://peninsulahcc.org/engage/food-closet-volunteer-resources/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-cardinal text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-cardinal-dark transition-colors"
                >
                  Sign Up
                </a>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">Afternoon Shift</div>
                  <div className="text-xs text-gray-500">12:00 PM – 2:30 PM</div>
                </div>
                <a
                  href="https://peninsulahcc.org/engage/food-closet-volunteer-resources/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-cardinal text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-cardinal-dark transition-colors"
                >
                  Sign Up
                </a>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-2 italic">Shift times are flexible by around 15–30 minutes. Sign up directly through Peninsula Healthcare Connection's website.</p>
          </div>
        </div>

        {pastShifts.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setShowPast(!showPast)}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1"
            >
              <span className={`transition-transform ${showPast ? 'rotate-90' : ''}`}>▶</span>
              Past Shifts ({pastShifts.length})
            </button>
            {showPast && (
              <div className="mt-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
                {pastShifts.map((shift, i) => {
                  const s = getShiftStatus(shift);
                  const hasPeople = (s.driverList && s.driverList.length > 0) || (s.nonDriverList && s.nonDriverList.length > 0);
                  return (
                    <div key={i} className="rounded px-2 py-2 border-b border-gray-50 last:border-0">
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">{shift.date}</span> — {shift.site}
                      </div>
                      <div className="text-xs text-gray-500">{formatShiftDetails(shift)}</div>
                      <div className="flex flex-wrap gap-3 mt-1">
                        <span className="text-xs text-gray-400">Drivers: {s.drivers}/{(SITE_CAPACITY[shift.site] || {}).drivers || 3}</span>
                        <span className="text-xs text-gray-400">Non-drivers: {s.nonDrivers}/{(SITE_CAPACITY[shift.site] || {}).nonDrivers || 3}</span>
                        {s.eventLead ? (
                          <span className="text-xs text-green-700">{s.eventLead} is the event lead</span>
                        ) : (
                          <span className="text-xs text-gray-400">Event lead: none</span>
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
                                <span key={j}>{p.name}{p.studentType ? ` [${STUDENT_TYPE_LABELS[p.studentType] || p.studentType}]` : ''}{p.email ? ` ${p.email}` : ''}{p.phone ? ` (${p.phone})` : ''}{j < s.driverList.length - 1 ? ', ' : ''}</span>
                              ))}
                            </div>
                          )}
                          {s.nonDriverList && s.nonDriverList.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-600">Non-drivers:</span>{' '}
                              {s.nonDriverList.map((p, j) => (
                                <span key={j}>{p.name}{p.studentType ? ` [${STUDENT_TYPE_LABELS[p.studentType] || p.studentType}]` : ''}{p.email ? ` ${p.email}` : ''}{p.phone ? ` (${p.phone})` : ''}{j < s.nonDriverList.length - 1 ? ', ' : ''}</span>
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
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
