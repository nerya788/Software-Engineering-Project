import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { API_URL } from "../config";

const RsvpPage = () => {
  const { eventId } = useParams();

  const [step, setStep] = useState("phone"); // phone | form | done
  const [loading, setLoading] = useState(false);

  const [phone, setPhone] = useState("");
  const [guest, setGuest] = useState(null);

  // NEW: only used when guest is unknown
  const [fullName, setFullName] = useState("");

  const [form, setForm] = useState({
    rsvp_status: "attending", // attending | declined | pending
    amount_invited: 1,
    side: "friend",
    meal_option: "standard", // standard/special/veggie/vegan/kids
    dietary_notes: "",
  });

  const inputClass =
    "w-full p-3 border rounded-xl outline-none transition duration-200 text-sm bg-white border-surface-200 focus:ring-2 focus:ring-purple-500 dark:bg-surface-700 dark:border-surface-600 dark:text-white dark:placeholder-surface-400";

  const cardClass =
    "max-w-xl mx-auto bg-white dark:bg-surface-800 shadow-xl shadow-surface-200/60 dark:shadow-none rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700";

  useEffect(() => {
    document.documentElement.dir = "rtl";
  }, []);

  const onLookup = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;

    try {
      setLoading(true);

      // ✅ match backend route + payload
      const res = await axios.post(`${API_URL}/api/rsvp/lookup`, {
        eventId,
        phone: phone.trim(),
      });

      if (!res.data?.found) {
        // not found => unknown
        setGuest(null);
        setFullName("");
        setForm((prev) => ({ ...prev }));
        setStep("form");
        return;
      }

      setGuest(res.data.guest);

      setForm({
        rsvp_status: res.data.guest?.rsvp_status || "attending",
        amount_invited: res.data.guest?.amount_invited || 1,
        side: res.data.guest?.side || "friend",
        meal_option: res.data.guest?.meal_option || "standard",
        dietary_notes: res.data.guest?.dietary_notes || "",
      });

      setStep("form");
    } catch (err) {
      console.error(err);
      alert("שגיאה בזיהוי מספר הטלפון");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;

    try {
      setLoading(true);

      // ✅ match backend route + payload names
      await axios.post(`${API_URL}/api/rsvp/submit`, {
        eventId,
        phone: phone.trim(),
        fullName: guest?.full_name || fullName.trim() || undefined,
        status: form.rsvp_status,
        count: Number(form.amount_invited) || 1,
        side: form.side,
        mealOption: form.meal_option,
        // dietaryNotes exists in your DB but your submit route currently doesn't accept it
        // so we don't send it to avoid confusion
      });

      setStep("done");
    } catch (err) {
      console.error(err);
      alert("שגיאה בשליחת תשובה");
    } finally {
      setLoading(false);
    }
  };

  const isUnknown = !guest;

  return (
    <div className="min-h-screen p-6 md:p-10 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-50">
      <div className={cardClass}>
        <div className="p-8 border-b border-surface-100 dark:border-surface-700">
          <h1 className="text-3xl font-extrabold tracking-tight">אישור הגעה</h1>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
            אנא מלא/י את הפרטים כדי שנוכל להתעדכן 🙂
          </p>
        </div>

        {step === "phone" && (
          <form onSubmit={onLookup} className="p-8 space-y-4">
            <label className="block text-sm font-bold text-surface-700 dark:text-surface-200">
              מספר טלפון
            </label>
            <input
              className={inputClass}
              type="tel"
              placeholder="לדוגמה: 05XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <button
              disabled={loading}
              className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
            >
              {loading ? "בודק..." : "המשך"}
            </button>

            <p className="text-xs text-surface-500 dark:text-surface-400">
              אם המספר לא מזוהה במערכת, הוא יישמר כ־"אורח לא מזוהה".
            </p>
          </form>
        )}

        {step === "form" && (
          <form onSubmit={onSubmit} className="p-8 space-y-5">
            <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-700/40 border border-surface-200 dark:border-surface-700">
              <div className="text-sm text-surface-600 dark:text-surface-300">
                מזוהה:{" "}
                <span className="font-bold">
                  {guest?.full_name || "אורח לא מזוהה"}
                </span>
              </div>
              <div className="text-xs mt-1 text-surface-500 dark:text-surface-400 font-mono">
                {guest?.phone || phone}
              </div>
            </div>

            {/* ✅ NEW: if unknown, ask for name */}
            {isUnknown && (
              <div>
                <label className="block text-sm font-bold mb-2">שם מלא</label>
                <input
                  className={inputClass}
                  type="text"
                  placeholder="לא חובה, אבל מומלץ"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold mb-2">האם מגיע/ה?</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, rsvp_status: "attending" })}
                  className={`flex-1 py-3 rounded-xl font-bold transition border ${
                    form.rsvp_status === "attending"
                      ? "bg-emerald-600 text-white border-emerald-700"
                      : "bg-white dark:bg-surface-700 border-surface-200 dark:border-surface-600"
                  }`}
                >
                  ✅ מגיע/ה
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, rsvp_status: "declined" })}
                  className={`flex-1 py-3 rounded-xl font-bold transition border ${
                    form.rsvp_status === "declined"
                      ? "bg-rose-600 text-white border-rose-700"
                      : "bg-white dark:bg-surface-700 border-surface-200 dark:border-surface-600"
                  }`}
                >
                  ❌ לא מגיע/ה
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">כמות אנשים</label>
                <input
                  className={inputClass}
                  type="number"
                  min="1"
                  value={form.amount_invited}
                  onChange={(e) =>
                    setForm({ ...form, amount_invited: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">צד</label>
                <select
                  className={`${inputClass} cursor-pointer`}
                  value={form.side}
                  onChange={(e) => setForm({ ...form, side: e.target.value })}
                >
                  <option value="friend">חברים</option>
                  <option value="bride">צד כלה</option>
                  <option value="groom">צד חתן</option>
                  <option value="family">משפחה</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">סוג מנה</label>
              <select
                className={`${inputClass} cursor-pointer`}
                value={form.meal_option}
                onChange={(e) =>
                  setForm({ ...form, meal_option: e.target.value })
                }
              >
                <option value="standard">מנה רגילה</option>
                <option value="special">מנה מיוחדת</option>
                <option value="veggie">צמחוני</option>
                <option value="vegan">טבעוני</option>
                <option value="kids">מנת ילדים</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">הערות / אלרגיות</label>
              <input
                className={inputClass}
                type="text"
                placeholder="לא חובה"
                value={form.dietary_notes}
                onChange={(e) =>
                  setForm({ ...form, dietary_notes: e.target.value })
                }
              />
            </div>

            <button
              disabled={loading}
              className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
            >
              {loading ? "שולח..." : "שלח"}
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="p-10 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-2xl font-extrabold">תודה! עודכן בהצלחה</h2>
            <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
              אפשר לסגור את הדף 🙂
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RsvpPage;
