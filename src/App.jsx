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
    return savedRate ? savedRate : '';
    
  });
  const [indemnityRate, setIndemnityRate] = useState(() => {
    const savedIndemnity = localStorage.getItem('indemnityRate');
    return savedIndemnity ? savedIndemnity : 0; // по умолчанию 4 €
  });

  const overtimeLimitHours = 45;
  const overtimeMultiplier = 1.25;

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
  const handleRateChange = (e) => setHourlyRate(e.target.value);

  const handleAddWorkDay = () => {
    if (selectedDate && startTime && endTime) {
      const startDateTime = new Date(`${selectedDate}T${startTime}`);
      const endDateTime = new Date(`${selectedDate}T${endTime}`);

      if (endDateTime <= startDateTime) {
        alert("L'heure de fin ne peut pas être avant l'heure de début !");
        return;
      }

      const diffInMilliseconds = endDateTime - startDateTime;
      let workedHours = diffInMilliseconds / (1000 * 60 * 60);

      workedHours = Math.round(workedHours / 0.25) * 0.25;

      const newWorkData = [...workData, { date: selectedDate, startTime, endTime, workedHours }];
      setWorkData(newWorkData);
    } else {
      alert('Veuillez remplir tous les champs.');
    }
  };

  const handleDeleteWorkDay = (index) => {
    const newWorkData = workData.filter((_, i) => i !== index);
    setWorkData(newWorkData);
  };

  const handleClearAll = () => {
    if (window.confirm('Êtes-vous sûr de vouloir tout effacer ?')) {
      setWorkData([]);
      setSelectedDate('');
      setStartTime('');
      setEndTime('');
      setHourlyRate('');
      localStorage.clear();
    }
  };

  const generatePDF = () => {
    const sortedWorkData = workData.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB; // сортировка по возрастанию
    });
  
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("Heures de travail et salaire: ", 20, 20);
  
    let yPosition = 30;
    
    // Перебираем отсортированные данные
    sortedWorkData.forEach(day => {
      doc.text(`${day.date} - ${day.startTime} à ${day.endTime}: ${day.workedHours.toFixed(2)} h`, 20, yPosition);
      yPosition += 10;
    });
  
    const { normalHours, overtimeHours } = calculateTotals();
    const normalPay = normalHours * (parseFloat(hourlyRate) || 0);
    const overtimePay = overtimeHours * (parseFloat(hourlyRate) || 0) * overtimeMultiplier;
    const totalPay = normalPay + overtimePay;
  
    const heuresTotales = normalHours + overtimeHours;
    
    // Получаем уникальные даты
    const uniqueDates = new Set(sortedWorkData.map(day => day.date));
    const totalIndemnity = uniqueDates.size * (isNaN(indemnityRate) ? 0 : indemnityRate);
    const grandTotalPay = totalPay + totalIndemnity;
  
    yPosition += 10;
    doc.text(`Heures normales : ${normalHours.toFixed(2)} h`, 20, yPosition);
    yPosition += 10;
    doc.text(`Heures supplémentaires : ${overtimeHours.toFixed(2)} h`, 20, yPosition);
    yPosition += 10;
    doc.text(`Heures totales : ${heuresTotales.toFixed(2)} h`, 20, yPosition);
    yPosition += 10;
    doc.text(`Paiement heures normales : ${normalPay.toFixed(2)} €`, 20, yPosition);
    yPosition += 10;
    doc.text(`Paiement heures supplémentaires : ${overtimePay.toFixed(2)} €`, 20, yPosition);
    yPosition += 10;
    doc.text(`Indemnités d'entretien : ${totalIndemnity.toFixed(2)} €`, 20, yPosition);
    yPosition += 10;
    doc.text(`Total général : ${grandTotalPay.toFixed(2)} €`, 20, yPosition);
  
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

  const weeksData = groupByWeeks();

  const calculateTotals = () => {
    let normalHours = 0;
    let overtimeHours = 0;

    Object.values(weeksData).forEach(week => {
      if (week.hours <= overtimeLimitHours) {
        normalHours += week.hours;
      } else {
        normalHours += overtimeLimitHours;
        overtimeHours += (week.hours - overtimeLimitHours);
      }
    });

    return { normalHours, overtimeHours };
  };

  const { normalHours, overtimeHours } = calculateTotals();

  const normalPay = normalHours * parseFloat(hourlyRate || 0);
  const overtimePay = overtimeHours * parseFloat(hourlyRate || 0) * overtimeMultiplier;
  const totalPay = normalPay + overtimePay;

  
  const totalIndemnity = workData.length * parseFloat(indemnityRate || 0);

const heuresTotales = normalHours + overtimeHours;
const grandTotalPay = totalPay + totalIndemnity;

  return (
    <div className="app-container">
      <h1>Heures de travail et salaire</h1>

      <div className="form-container">
        <div className="input-container">
          <label>Date :</label>
          <input type="date" value={selectedDate} onChange={handleDateChange} />
        </div>
        <div className="input-container">
          <label>Heure de début :</label>
          <input type="time" value={startTime} onChange={handleStartTimeChange} />
        </div>
        <div className="input-container">
          <label>Heure de fin :</label>
          <input type="time" value={endTime} onChange={handleEndTimeChange} />
        </div>
        <div className="input-container">
          <label>Tarif horaire (€) :</label>
          <input type="number" step="any" value={hourlyRate} onChange={handleRateChange} />
        </div>
        <div className="input-container">
          <label>Indemnité d'entretien par jour (€) :</label>
          <input
             type="text"
             value={indemnityRate}
             onChange={(e) => {
              // Меняем запятую на точку
          const value = e.target.value.replace(',', '.');
           setIndemnityRate(value);
    }}
    onBlur={() => {
      setIndemnityRate((prev) => {
        const number = parseFloat(prev);
        if (isNaN(number)) {
          alert("Merci d'entrer un nombre valide pour l'indemnité !");
          return 0;
        }
        return number;
      });
    }}
    placeholder="Exemple: 3,20 ou 3.20"
  />

      </div>
        <button className="add-button" onClick={handleAddWorkDay}>Ajouter la journée</button>
        <button className="clear-button" onClick={handleClearAll}>Tout effacer</button>
      </div>

      <div className="result">
  <h2>Heures normales : {normalHours.toFixed(2)} h</h2>
  <h2>Heures supplémentaires : {overtimeHours.toFixed(2)} h</h2>
  <h2><strong>Heures totales : {heuresTotales.toFixed(2)} h</strong></h2>
  <h2>Paiement heures normales : {normalPay.toFixed(2)} €</h2>
  <h2>Paiement heures supplémentaires : {overtimePay.toFixed(2)} €</h2>
  <h2>Indemnités d'entretien : {totalIndemnity.toFixed(2)} €</h2>
  <h2><strong>Total général : {grandTotalPay.toFixed(2)} €</strong></h2>
</div>

      <div className="weeks-list">
        <h3>Heures par semaine :</h3>
        <ul>
          {Object.entries(weeksData).map(([week, data], index) => {
            const overtime = data.hours > overtimeLimitHours ? data.hours - overtimeLimitHours : 0;
            return (
              <li key={index} className={overtime > 0 ? 'overtime' : ''}>
                {week} : 
                <span className="normal-hours">
                  {Math.min(data.hours, overtimeLimitHours).toFixed(2)} h normales
                </span>
                {overtime > 0 && (
                  <span className="overtime-hours">
                    {' + ' + overtime.toFixed(2)} h supplémentaires
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="work-list">
  <h3>Journées travaillées :</h3>
  <ul>
    {workData
      .slice() // сначала копируем массив, чтобы не мутировать оригинал
      .sort((a, b) => new Date(a.date) - new Date(b.date)) // сортируем по дате
      .map((day, index) => {
        // дальше твой текущий код:
        const basePay = day.workedHours * parseFloat(hourlyRate || 0);
        let overtimePayDay = 0;

        const date = new Date(day.date);
        const weekKey = `${date.getFullYear()}-S${getWeekNumber(date)}`;
        const weekHoursBefore = weeksData[weekKey].days
          .slice(0, weeksData[weekKey].days.findIndex(d => d === day))
          .reduce((sum, d) => sum + d.workedHours, 0);

        const availableNormalHours = Math.max(0, overtimeLimitHours - weekHoursBefore);
        const normalHoursThisDay = Math.min(availableNormalHours, day.workedHours);
        const overtimeHoursThisDay = day.workedHours - normalHoursThisDay;

        const normalPayDay = normalHoursThisDay * parseFloat(hourlyRate || 0);
        overtimePayDay = overtimeHoursThisDay * parseFloat(hourlyRate || 0) * overtimeMultiplier;

        

        return (
          <li key={index} className="work-item">
            {day.date} : {day.startTime} - {day.endTime} ({day.workedHours.toFixed(2)} h)
            <div>
              <div>Gains normaux : {normalPayDay.toFixed(2)} €</div>
              {overtimeHoursThisDay > 0 && (
                <div>Gains supplémentaires : {overtimePayDay.toFixed(2)} €</div>
              )}
            </div>
            <button className="delete-button" onClick={() => handleDeleteWorkDay(index)}>Supprimer</button>
          </li>
        );
      })}
  </ul>
</div>

      <button className="generate-pdf-button" onClick={generatePDF}>Générer le PDF</button>
    </div>
  );
}

function getWeekNumber(date) {
  const tempDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  tempDate.setHours(0, 0, 0, 0);
  tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
  const week1 = new Date(tempDate.getFullYear(), 0, 4);
  return 1 + Math.round(((tempDate - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

export default App;