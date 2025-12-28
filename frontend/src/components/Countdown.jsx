import React, { useState, useEffect } from 'react';

const Countdown = ({ targetDate, title }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        ימים: Math.floor(difference / (1000 * 60 * 60 * 24)),
        שעות: Math.floor((difference / (1000 * 60 * 60)) % 24),
        דקות: Math.floor((difference / 1000 / 60) % 60),
        שניות: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!targetDate || Object.keys(timeLeft).length === 0) return null;

  const TimeBox = ({ value, label }) => (
    <div className="flex flex-col items-center p-3 border shadow-sm bg-white/20 backdrop-blur-md rounded-xl min-w-[80px] border-white/30">
      <span className="text-3xl font-bold text-white drop-shadow-sm">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-xs font-medium text-white/90">{label}</span>
    </div>
  );

  return (
    // השינוי העיקרי: הגרדיאנט נהיה עמוק וכהה יותר במצב לילה (dark:from-violet-900)
    <div className="relative w-full p-8 mb-10 overflow-hidden text-white transition-all duration-300 shadow-xl rounded-3xl bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-900 dark:to-fuchsia-900 shadow-violet-200 dark:shadow-none">
      
      {/* אלמנטים דקורטיביים ברקע */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 bg-white rounded-full w-64 h-64 opacity-5 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-10 -mb-10 bg-pink-400 rounded-full w-48 h-48 opacity-20 blur-3xl"></div>
      
      <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row">
        <div className="text-center md:text-right">
          <div className="inline-block px-3 py-1 mb-2 text-xs font-bold border rounded-full bg-white/20 backdrop-blur-sm border-white/20">
            האירוע הקרוב
          </div>
          <h3 className="mb-2 text-3xl font-extrabold tracking-tight md:text-4xl text-white drop-shadow-md">{title} 💍</h3>
          <p className="flex items-center justify-center gap-2 text-lg md:justify-start text-pink-100">
            📅 {new Date(targetDate).toLocaleDateString('he-IL')}
          </p>
        </div>

        <div className="flex gap-4" dir="rtl">
          <TimeBox value={timeLeft.ימים} label="ימים" />
          <TimeBox value={timeLeft.שעות} label="שעות" />
          <TimeBox value={timeLeft.דקות} label="דקות" />
          <TimeBox value={timeLeft.שניות} label="שניות" />
        </div>
      </div>
    </div>
  );
};

export default Countdown;