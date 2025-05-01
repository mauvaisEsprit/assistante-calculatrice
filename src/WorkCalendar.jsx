import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './WorkCalendar.css';

const WorkCalendar = ({ workData }) => {
  const [selectedDate, setSelectedDate] = useState(null);

  const toLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const workedDates = new Set(workData.map(d => d.date)); // Уже в формате 'YYYY-MM-DD'

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;
  
    const classes = [];
  
    if (workedDates.has(toLocalDateString(date))) {
      classes.push('work-day');
    }
  
    const dayOfWeek = date.getDay(); // 0 (воскресенье) - 6 (суббота)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      classes.push('weekend-day');
    }
  
    return classes;
  };
  

  const selectedWorkDay = workData.find(
    d => selectedDate && d.date === toLocalDateString(selectedDate)
  );

  return (
    <div className="calendar-wrapper">
      <h2>Calendrier de travail</h2>
      <Calendar
        onChange={setSelectedDate}
        value={selectedDate}
        tileClassName={tileClassName}
        locale="fr-FR"
        next2Label={null}
        prev2Label={null}
        nextLabel={<span className="arrow">→</span>}
        prevLabel={<span className="arrow">←</span>}
      />

      {selectedWorkDay ? (
        <div className="work-info">
          <h3>Détails du {new Date(selectedWorkDay.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
          <p>Heure: {selectedWorkDay.startTime} à {selectedWorkDay.endTime}</p>
          <p>Durée: {selectedWorkDay.workedHours.toFixed(2)} h</p>
        </div>
      ) : selectedDate ? (
        <div className="work-info">
          <h3>Aucune donnée pour le {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
        </div>
      ) : null}
    </div>
  );
};

export default WorkCalendar;
