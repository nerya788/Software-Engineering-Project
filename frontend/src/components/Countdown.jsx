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
    <div className="flex flex-col items-center bg-white/20 backdrop-blur-md rounded-xl p-3 min-w-[80px] border border-white/30 shadow-sm">
      <span className="text-3xl font-bold text-white drop-shadow-sm">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-xs text-white/90 font-medium">{label}</span>
    </div>
  );

  return (
    <div className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden mb-10">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-400 opacity-20 rounded-full blur-3xl -ml-10 -mb-10"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="text-center md:text-right">
          <div className="inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-2 backdrop-blur-sm border border-white/20">
            האירוע הקרוב
          </div>
          <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{title} 💍</h3>
          <p className="text-pink-100 text-lg flex items-center gap-2 justify-center md:justify-start">
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