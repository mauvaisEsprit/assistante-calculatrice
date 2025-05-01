import React, { useState, useEffect } from 'react';
import './App.css';
import { jsPDF } from 'jspdf';



function App() {
  const [workData, setWorkData] = useState(() => {
    const saved = localStorage.getItem('workData');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [hourlyRate, setHourlyRate] = useState(() => {
    const savedRate = localStorage.getItem('hourlyRate');
    return savedRate ? parseFloat(savedRate) : 3.12;  // Преобразуем в число
  });
  const [indemnityRate, setIndemnityRate] = useState(() => {
    const savedIndemnity = localStorage.getItem('indemnityRate');
    return savedIndemnity ? parseFloat(savedIndemnity) : 3.75;  // Преобразуем в число
  });
 
  const [weekLimit, setWeekLimit] = useState(45);

  const [notification, setNotification] = useState({ message: '', isError: false });

const showNotification = (message, isError = false) => {
  setNotification({ message, isError });
  setTimeout(() => {
    setNotification({ message: '', isError: false });
  }, 3000);
};


  const overtimeMultiplier = 1.25;



  const handleIndemnityRateChange = (e) => {
    let value = e.target.value;
  
    // Заменяем запятую на точку
    value = value.replace(',', '.');
  
    // Проверяем, что введено корректное число
    if (value === '' || !isNaN(value)) {
      setIndemnityRate(value); // Сохраняем введенное значение как строку
    }
  };
  


  useEffect(() => {
    localStorage.setItem('workData', JSON.stringify(workData));
  }, [workData]);

  useEffect(() => {
    localStorage.setItem('hourlyRate', hourlyRate);
  }, [hourlyRate]);

  useEffect(() => {
    localStorage.setItem('indemnityRate', indemnityRate);
  }, [indemnityRate]);

  const handleDateChange = (e) => setSelectedDate(e.target.value);
  const handleStartTimeChange = (e) => setStartTime(e.target.value);
  const handleEndTimeChange = (e) => setEndTime(e.target.value);
  const handleRateChange = (e) => {
    let value = e.target.value;
  
    // Заменяем запятую на точку
    value = value.replace(',', '.');
  
    // Проверяем, что введено корректное число
    if (value === '' || !isNaN(value)) {
      setHourlyRate(value); // Сохраняем введенное значение как строку
    }
  };
  
  const handleLanguageChange = (e) => setLanguage(e.target.value);
  const handleWeekLimitChange = (e) => setWeekLimit(parseFloat(e.target.value)); // Преобразуем в число

  const roundToQuarterHour = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const roundedMinutes = Math.round(totalMinutes / 15) * 15;
    const roundedHours = Math.floor(roundedMinutes / 60);
    const roundedMins = roundedMinutes % 60;
    return `${String(roundedHours).padStart(2, '0')}:${String(roundedMins).padStart(2, '0')}`;
  };

  const handleAddWorkDay = () => {
    if (selectedDate && startTime && endTime) {
      const roundedStartTime = roundToQuarterHour(startTime);
      const roundedEndTime = roundToQuarterHour(endTime);
  
      const startDateTime = new Date(`${selectedDate}T${roundedStartTime}`);
      const endDateTime = new Date(`${selectedDate}T${roundedEndTime}`);
  
      if (endDateTime <= startDateTime) {
        showNotification("L'heure de fin ne peut pas être avant l'heure de début !", true);
        return;
      }
  
      const existingDay = workData.find((entry) => entry.date === selectedDate);
      if (existingDay) {
        showNotification("Ce jour existe déjà !", true);
        return;
      }
  
      const diffInMilliseconds = endDateTime - startDateTime;
      let workedHours = diffInMilliseconds / (1000 * 60 * 60);
      workedHours = Math.round(workedHours / 0.25) * 0.25;
  
      const newWorkData = [...workData, {
        date: selectedDate,
        startTime: roundedStartTime,
        endTime: roundedEndTime,
        workedHours
      }];
      setWorkData(newWorkData);
      showNotification("Journée ajoutée avec succès !");
    } else {
      showNotification("Veuillez remplir tous les champs.", true);
    }
  };
  
  const handleDeleteWorkDay = (indexToDelete) => {
    const confirmed = window.confirm("Êtes-vous sûr de vouloir supprimer cette journée ?");
    if (confirmed) {
      const newWorkData = workData.filter((_, index) => index !== indexToDelete);
      setWorkData(newWorkData);
      showNotification("Journée supprimée.");
    }
  };
  
  

  const handleClearAll = () => {
    if (window.confirm('Êtes-vous sûr de vouloir tout effacer ?' )) {
      setWorkData([]);
      setSelectedDate('');
      setStartTime('');
      setEndTime('');
      setHourlyRate('');
      localStorage.clear();
    }
  };

  const generatePDF = () => {
    const sortedWorkData = [...workData].sort((a, b) => new Date(a.date) - new Date(b.date));
    const doc = new jsPDF();
  
    doc.setFontSize(16);
    doc.text("Heures de travail et salaire:" , 20, 20);
  
    let yPosition = 30;
  
    sortedWorkData.forEach(day => {
      const timeFormat = `${day.startTime} à ${day.endTime}`;
      const decimalFormat = `${day.workedHours.toFixed(2)} h`;
  
      const hours = Math.floor(day.workedHours);
      const minutes = Math.round((day.workedHours - hours) * 60);
      const workedTimeFormatted = `${hours}h${minutes < 10 ? '0' + minutes : minutes}m/${day.workedHours.toFixed(2)} h`;
  
      doc.text(`${day.date} - ${timeFormat} ${workedTimeFormatted}`, 20, yPosition);
      yPosition += 10;
    });
  
    const { normalHours, overtimeHours } = calculateTotals();
    const normalPay = normalHours * (hourlyRate || 0);
    const overtimePay = overtimeHours * (hourlyRate || 0) * overtimeMultiplier;
    const totalPay = normalPay + overtimePay;
  
    const uniqueDates = new Set(sortedWorkData.map(day => day.date));
    const totalIndemnity = uniqueDates.size * (isNaN(indemnityRate) ? 0 : indemnityRate);
    const grandTotalPay = totalPay + totalIndemnity;
  
    const heuresTotales = normalHours + overtimeHours;
  
    yPosition += 10;
doc.text('Heures normales : ' + normalHours.toFixed(2) + ' h', 20, yPosition);
yPosition += 10;
doc.text('Heures supplémentaires : ' + overtimeHours.toFixed(2) + ' h', 20, yPosition);
yPosition += 10;
doc.text('Heures totales : ' + heuresTotales.toFixed(2) + ' h', 20, yPosition);
yPosition += 10;
doc.text('Paiement heures normales : ' + normalPay.toFixed(2) + ' €', 20, yPosition);
yPosition += 10;
doc.text('Paiement heures supplémentaires : ' + overtimePay.toFixed(2) + ' €', 20, yPosition);
yPosition += 10;
doc.text('Indemnités d\'entretien : ' + totalIndemnity.toFixed(2) + ' €', 20, yPosition);
yPosition += 10;
doc.text('Total général : ' + grandTotalPay.toFixed(2) + ' €', 20, yPosition);

const generatedDate = new Date().toLocaleDateString();
yPosition += 10;
doc.text('Date de génération du PDF : ' + generatedDate, 20, yPosition);

doc.save("rapport_heures_travail.pdf");

  };
  

  const groupByWeeks = () => {
    const weeks = {};

    workData.forEach(day => {
      const date = new Date(day.date);
      const year = date.getFullYear();
      const weekNumber = getWeekNumber(date);

      const key = `${year}-S${weekNumber}`;
      if (!weeks[key]) {
        weeks[key] = { hours: 0, days: [] };
      }
      weeks[key].hours += day.workedHours;
      weeks[key].days.push(day);
    });

    return weeks;
  };

  const calculateTotals = () => {
    let normalHours = 0;
    let overtimeHours = 0;

    Object.values(groupByWeeks()).forEach(week => {
      if (week.hours <= weekLimit) {
        normalHours += week.hours;
      } else {
        normalHours += weekLimit;
        overtimeHours += (week.hours - weekLimit);
      }
    });

    return { normalHours, overtimeHours };
  };

  const getWeekNumber = (date) => {
    const tempDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    tempDate.setDate(tempDate.getDate() - tempDate.getDay() + 1);  // Понедельник недели
    const firstDayOfYear = new Date(tempDate.getFullYear(), 0, 1);
    const daysInBetween = Math.floor((tempDate - firstDayOfYear) / (24 * 60 * 60 * 1000));
    return Math.ceil((daysInBetween + 1) / 7);  // Вычисление номера недели
  };

  return (
    <div className="App">
      <h1>Nounoulatrice</h1>
      <div className="form">
      <label>Date:</label>
       <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
        />
         <label>Heure de début:</label>
         <input
          type="time"
          value={startTime}
          onChange={handleStartTimeChange}
        />
         <label>Heure de fin:</label>
          <input
            type="time"
            value={endTime}
            onChange={handleEndTimeChange}
          />
        <label>
       Taux horaire:
        <input
          type="number"
          step="0.01"
          value={hourlyRate}
          onChange={handleRateChange}
         
        />
        </label>
         <label>
         Indemnité d'entretien:
        <input
          type="number"
          step="0.01"
          value={indemnityRate}
          onChange={handleIndemnityRateChange}
          
          
        />
        </label>
      <div className="weekLimit">
        <label>
         Limite hebdomadaire:
          <input
            type="number"
            value={weekLimit}
            onChange={handleWeekLimitChange}
          />
        </label>
      </div>
        <button onClick={handleAddWorkDay}>
         Ajouter une journée de travail:
        </button>
        {notification.message && (
  <div className={`notification ${notification.isError ? 'error' : 'success'}`}>
    {notification.message}
  </div>
)}


        <button
        className='clear-history-button' 
        onClick={handleClearAll}>
         Effacer l'Historique
        </button>
      </div>
      <div className="workHistory">
        <h2>Historique des heures:</h2>
        <ul>
          {workData.map((day, index) => (
            <li key={index}>
              {`${day.date} - ${day.startTime} à ${day.endTime} - ${day.workedHours.toFixed(2)} h`}
              <button onClick={() => handleDeleteWorkDay(index)}>
                Supprimer
              </button>
            </li>
          ))}
        </ul>
        <div className="totals">
  <h2>Total heures:</h2>
  <p>normale: {calculateTotals().normalHours.toFixed(2)} h</p>
  <p>supplémentaires: {calculateTotals().overtimeHours.toFixed(2)} h</p>
  <p>Paye normale: {(calculateTotals().normalHours * hourlyRate).toFixed(2)} €</p>
  <p>Paye supp: {(calculateTotals().overtimeHours * hourlyRate * overtimeMultiplier).toFixed(2)} €</p>
  <p>Indemnité d'entretien: {(new Set(workData.map(d => d.date)).size * indemnityRate).toFixed(2)} €</p>
  <p>Paye total: {(
    calculateTotals().normalHours * hourlyRate +
    calculateTotals().overtimeHours * hourlyRate * overtimeMultiplier +
    new Set(workData.map(d => d.date)).size * indemnityRate
  ).toFixed(2)} €</p>
</div>

        <button 
        className='pdf-button'
        onClick={generatePDF}>
          Générer le PDF
        </button>
      </div>
      
    </div>
  );
}

export default App;














