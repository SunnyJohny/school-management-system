import React, { useState, useEffect } from 'react';

const DateTimeDisplay = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const formatTime = (num) => (num < 10 ? `0${num}` : num);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayOfWeek = daysOfWeek[currentDateTime.getDay()];

  const formattedDate = `${currentDayOfWeek}, ${currentDateTime.toDateString()}`;

  return (
    <div>
      <h1>
        {formatTime(currentDateTime.getHours())}:{formatTime(currentDateTime.getMinutes())}:
        {formatTime(currentDateTime.getSeconds())}
      </h1>
      <p>{formattedDate}</p>
    </div>
  );
};

export default DateTimeDisplay;
