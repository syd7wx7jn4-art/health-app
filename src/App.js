import { useState } from 'react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [weight, setWeight] = useState(65.5);
  const [kcalIntake, setKcalIntake] = useState(0);
  const [activities, setActivities] = useState(0);
  const [diaryData, setDiaryData] = useState({}); // 儲存每日日誌數據 { date: { calories, protein, carbs, fat, sleep, isGoalMet } }

  // Home Page Component
  const HomePage = () => {
    const handleQuickAction = (action) => {
      if (action === 'diet') setActiveTab('diet');
      else if (action === 'workout') setActiveTab('workout');
      else alert('AI Coach - Coming Soon');
    };

    return (
      <div className="home-page">
        <div className="greeting">今天也要保持平衡</div>
        
        <div className="top-cards">
          <div className="stat-card kcal-card">
            <div className="card-icon">🔥</div>
            <div className="card-content">
              <div className="card-label">KCAL INTAKE</div>
              <div className="card-value">{kcalIntake || 0}</div>
            </div>
          </div>
          
          <div className="stat-card activity-card">
            <div className="card-icon">💪</div>
            <div className="card-content">
              <div className="card-label">ACTIVITIES</div>
              <div className="card-value">{activities || 0}</div>
            </div>
          </div>
        </div>

        <div className="weight-card">
          <div className="weight-label">WEIGHT</div>
          <div className="weight-value">{weight} <span className="weight-unit">kg</span></div>
        </div>

        <div className="quick-actions">
          <div className="section-title">QUICK ACTIONS</div>
          <div className="action-item" onClick={() => handleQuickAction('diet')}>
            <div className="action-icon">🍽️</div>
            <div className="action-text">Diet Log</div>
            <div className="action-arrow">›</div>
          </div>
          <div className="action-item" onClick={() => handleQuickAction('workout')}>
            <div className="action-icon">🏋️</div>
            <div className="action-text">Workout Log</div>
            <div className="action-arrow">›</div>
          </div>
          <div className="action-item" onClick={() => handleQuickAction('ai')}>
            <div className="action-icon">🤖</div>
            <div className="action-text">AI Coach</div>
            <div className="action-arrow">›</div>
          </div>
        </div>
      </div>
    );
  };

  // Calendar Page Component
  const CalendarPage = () => {
    const [selectedDate, setSelectedDate] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
      calories: '',
      protein: 50,
      carbs: 50,
      fat: 50,
      sleep: 8
    });

    // Get date components in Hong Kong timezone
    const getHKDateComponents = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Hong_Kong",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
      const parts = formatter.formatToParts(now);
      const year = parseInt(parts.find(p => p.type === 'year').value);
      const month = parseInt(parts.find(p => p.type === 'month').value) - 1; // 0-indexed
      const day = parseInt(parts.find(p => p.type === 'day').value);
      return { year, month, day };
    };

    const hkToday = getHKDateComponents();
    const [currentMonth, setCurrentMonth] = useState({
      year: hkToday.year,
      month: hkToday.month
    });

    const today = {
      year: hkToday.year,
      month: hkToday.month,
      date: hkToday.day
    };

    // Get month name in Traditional Chinese
    const getMonthName = (year, month) => {
      const date = new Date(year, month, 1);
      return date.toLocaleDateString("zh-HK", { 
        year: "numeric", 
        month: "long",
        timeZone: "Asia/Hong_Kong"
      });
    };

    // Get calendar days for the current month
    const getCalendarDays = () => {
      const { year, month } = currentMonth;
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 6 = Saturday

      const days = [];

      // Add empty cells for days before the first day of the month
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
      }

      // Add all days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(day);
      }

      return days;
    };

    const calendarDays = getCalendarDays();

    // Handle date selection
    const handleDateClick = (day) => {
      if (day !== null) {
        const monthStr = String(currentMonth.month + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateStr = `${currentMonth.year}-${monthStr}-${dayStr}`;
        setSelectedDate(dateStr);
        
        // 如果該日期已有數據，載入到 modal
        const existingData = diaryData[dateStr];
        if (existingData) {
          setModalData({
            calories: existingData.calories || '',
            protein: existingData.protein || 50,
            carbs: existingData.carbs || 50,
            fat: existingData.fat || 50,
            sleep: existingData.sleep || 8
          });
        } else {
          setModalData({
            calories: '',
            protein: 50,
            carbs: 50,
            fat: 50,
            sleep: 8
          });
        }
      }
    };

    // Check if a day is today
    const isToday = (day) => {
      return day !== null &&
        currentMonth.year === today.year &&
        currentMonth.month === today.month &&
        day === today.date;
    };

    // Check if a day is selected
    const isSelected = (day) => {
      if (!selectedDate || day === null) return false;
      const [year, month, date] = selectedDate.split('-').map(Number);
      return currentMonth.year === year &&
        currentMonth.month === month - 1 &&
        day === date;
    };

    // Get date status (goal met or not)
    const getDateStatus = (day) => {
      if (day === null) return null;
      const monthStr = String(currentMonth.month + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${currentMonth.year}-${monthStr}-${dayStr}`;
      const data = diaryData[dateStr];
      return data ? data.isGoalMet : null;
    };

    // Handle modal submit
    const handleSubmit = () => {
      if (!selectedDate) return;
      
      // 簡單的達標判斷邏輯：卡路里 >= 1500 且睡眠 >= 7 小時
      const calories = parseInt(modalData.calories) || 0;
      const sleep = parseFloat(modalData.sleep) || 0;
      const isGoalMet = calories >= 1500 && sleep >= 7;

      const newData = {
        ...diaryData,
        [selectedDate]: {
          calories: calories,
          protein: modalData.protein,
          carbs: modalData.carbs,
          fat: modalData.fat,
          sleep: sleep,
          isGoalMet: isGoalMet
        }
      };
      
      setDiaryData(newData);
      setShowModal(false);
    };

    // Open modal for adding new entry
    const handleAddEntry = () => {
      const todayStr = `${hkToday.year}-${String(hkToday.month + 1).padStart(2, '0')}-${String(hkToday.day).padStart(2, '0')}`;
      setSelectedDate(todayStr);
      setModalData({
        calories: '',
        protein: 50,
        carbs: 50,
        fat: 50,
        sleep: 8
      });
      setShowModal(true);
    };

    // Week day labels (Sunday to Saturday)
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    return (
      <div className="calendar-page">
        <div className="page-title">日誌</div>
        
        <div className="calendar-container">
          <div className="calendar-header">
            <div className="calendar-month">
              {getMonthName(currentMonth.year, currentMonth.month)}
            </div>
          </div>

          <div className="calendar-grid">
            {/* Week day headers */}
            {weekDays.map((day, index) => (
              <div key={index} className="calendar-weekday">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((day, index) => {
              const isTodayDay = isToday(day);
              const isSelectedDay = isSelected(day);
              const dateStatus = getDateStatus(day);
              
              return (
                <div key={index} className="calendar-day-wrapper">
                  <div
                    className={`calendar-day ${day === null ? 'empty' : ''} ${isTodayDay ? 'today' : ''} ${isSelectedDay ? 'selected' : ''}`}
                    onClick={() => handleDateClick(day)}
                  >
                    {day !== null && day}
                  </div>
                  {day !== null && dateStatus !== null && (
                    <div className={`calendar-day-status ${dateStatus ? 'goal-met' : 'goal-not-met'}`}></div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedDate && (
            <div className="calendar-selected-date">
              已選日期：{selectedDate}
            </div>
          )}
        </div>

        {/* Add Button */}
        <button className="calendar-add-btn" onClick={handleAddEntry}>
          <span className="add-btn-icon">+</span>
        </button>

        {/* Modal/Sheet */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">記錄日誌</h3>
                <button className="modal-close-btn" onClick={() => setShowModal(false)}>×</button>
              </div>
              
              <div className="modal-content">
                <div className="modal-field">
                  <label className="modal-label">卡路里 (kcal)</label>
                  <input
                    type="number"
                    className="modal-input"
                    placeholder="輸入卡路里"
                    value={modalData.calories}
                    onChange={(e) => setModalData({ ...modalData, calories: e.target.value })}
                  />
                </div>

                <div className="modal-field">
                  <label className="modal-label">蛋白質 (P): {modalData.protein}g</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="5"
                    className="modal-slider"
                    value={modalData.protein}
                    onChange={(e) => setModalData({ ...modalData, protein: parseInt(e.target.value) })}
                  />
                </div>

                <div className="modal-field">
                  <label className="modal-label">碳水化合物 (C): {modalData.carbs}g</label>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    step="5"
                    className="modal-slider"
                    value={modalData.carbs}
                    onChange={(e) => setModalData({ ...modalData, carbs: parseInt(e.target.value) })}
                  />
                </div>

                <div className="modal-field">
                  <label className="modal-label">脂肪 (F): {modalData.fat}g</label>
                  <input
                    type="range"
                    min="0"
                    max="150"
                    step="5"
                    className="modal-slider"
                    value={modalData.fat}
                    onChange={(e) => setModalData({ ...modalData, fat: parseInt(e.target.value) })}
                  />
                </div>

                <div className="modal-field">
                  <label className="modal-label">睡眠時數 (小時)</label>
                  <select
                    className="modal-select"
                    value={modalData.sleep}
                    onChange={(e) => setModalData({ ...modalData, sleep: parseFloat(e.target.value) })}
                  >
                    {Array.from({ length: 25 }, (_, i) => i / 2).map(hours => (
                      <option key={hours} value={hours}>{hours} 小時</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button className="modal-submit-btn" onClick={handleSubmit}>
                  提交
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Diet Page Component
  const DietPage = () => {
    const [breakfast, setBreakfast] = useState({ protein: '', veggies: '', carbs: '' });
    const [lunch, setLunch] = useState({ protein: '', veggies: '', carbs: '' });
    const [dinner, setDinner] = useState({ protein: '', veggies: '', carbs: '' });
    const [snacks, setSnacks] = useState({ protein: '', veggies: '', carbs: '' });

    const handleSaveMeal = (mealType, macro, value) => {
      if (mealType === 'breakfast') setBreakfast({ ...breakfast, [macro]: value });
      else if (mealType === 'lunch') setLunch({ ...lunch, [macro]: value });
      else if (mealType === 'dinner') setDinner({ ...dinner, [macro]: value });
      else if (mealType === 'snacks') setSnacks({ ...snacks, [macro]: value });
    };

    const MealSection = ({ title, mealType, mealData, onSave }) => (
      <div className="meal-section">
        <div className="meal-title">{title}</div>
        <div className="photo-analysis">
          <div className="photo-placeholder">📷 Photo Analysis</div>
        </div>
        <div className="macros-input">
          <input
            type="number"
            placeholder="Protein (g)"
            value={mealData.protein}
            onChange={(e) => onSave(mealType, 'protein', e.target.value)}
            className="macro-input"
          />
          <input
            type="number"
            placeholder="Veggies (g)"
            value={mealData.veggies}
            onChange={(e) => onSave(mealType, 'veggies', e.target.value)}
            className="macro-input"
          />
          <input
            type="number"
            placeholder="Carbs (g)"
            value={mealData.carbs}
            onChange={(e) => onSave(mealType, 'carbs', e.target.value)}
            className="macro-input"
          />
        </div>
      </div>
    );

    return (
      <div className="diet-page">
        <div className="page-title">飲食記錄</div>
        <MealSection title="Breakfast" mealType="breakfast" mealData={breakfast} onSave={handleSaveMeal} />
        <MealSection title="Lunch" mealType="lunch" mealData={lunch} onSave={handleSaveMeal} />
        <MealSection title="Dinner" mealType="dinner" mealData={dinner} onSave={handleSaveMeal} />
        <MealSection title="Snacks" mealType="snacks" mealData={snacks} onSave={handleSaveMeal} />
      </div>
    );
  };

  // Workout Page Component
  const WorkoutPage = () => {
    const [workoutType, setWorkoutType] = useState('weight');
    const [exerciseName, setExerciseName] = useState('');
    const [kg, setKg] = useState('');
    const [reps, setReps] = useState('');

    const handleSave = () => {
      alert(`Exercise: ${exerciseName}\nType: ${workoutType}\nKg: ${kg}\nReps: ${reps}`);
      setActivities(prev => prev + 1);
    };

    return (
      <div className="workout-page">
        <div className="page-title">健身記錄</div>
        
        <div className="workout-toggle">
          <button
            className={`toggle-btn ${workoutType === 'weight' ? 'active' : ''}`}
            onClick={() => setWorkoutType('weight')}
          >
            Weight
          </button>
          <button
            className={`toggle-btn ${workoutType === 'cardio' ? 'active' : ''}`}
            onClick={() => setWorkoutType('cardio')}
          >
            Cardio
          </button>
        </div>

        <div className="workout-form">
          <input
            type="text"
            placeholder="Exercise Name"
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
            className="workout-input"
          />
          <input
            type="number"
            placeholder="Kg"
            value={kg}
            onChange={(e) => setKg(e.target.value)}
            className="workout-input"
          />
          <input
            type="number"
            placeholder="Reps"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="workout-input"
          />
          <button className="save-workout-btn" onClick={handleSave}>Save Workout</button>
        </div>
      </div>
    );
  };

  // Metrics Page Component
  const MetricsPage = () => {
    const [metrics, setMetrics] = useState({
      weight: '',
      gripStrength: '',
      sleep: '',
      water: ''
    });

    const handleInputChange = (field, value) => {
      setMetrics({ ...metrics, [field]: value });
    };

    const handleSaveData = () => {
      if (metrics.weight) setWeight(parseFloat(metrics.weight));
      alert(`Weight: ${metrics.weight || '未輸入'} kg\nGrip Strength: ${metrics.gripStrength || '未輸入'}\nSleep: ${metrics.sleep || '未輸入'} hours\nWater: ${metrics.water || '未輸入'} cc`);
    };

    return (
      <div className="metrics-page">
        <div className="page-title">數據記錄</div>
        
        <div className="metrics-form">
          <div className="metric-input-row">
            <label className="metric-label">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              placeholder="65.5"
              value={metrics.weight}
              onChange={(e) => handleInputChange('weight', e.target.value)}
              className="metric-input"
            />
          </div>

          <div className="metric-input-row">
            <label className="metric-label">Grip Strength</label>
            <input
              type="number"
              placeholder="50"
              value={metrics.gripStrength}
              onChange={(e) => handleInputChange('gripStrength', e.target.value)}
              className="metric-input"
            />
          </div>

          <div className="metric-input-row">
            <label className="metric-label">Sleep (hours)</label>
            <input
              type="number"
              step="0.1"
              placeholder="8"
              value={metrics.sleep}
              onChange={(e) => handleInputChange('sleep', e.target.value)}
              className="metric-input"
            />
          </div>

          <div className="metric-input-row">
            <label className="metric-label">Water (cc)</label>
            <input
              type="number"
              placeholder="2000"
              value={metrics.water}
              onChange={(e) => handleInputChange('water', e.target.value)}
              className="metric-input"
            />
          </div>

          <button className="save-data-btn" onClick={handleSaveData}>Save Data</button>
        </div>
      </div>
    );
  };

  // Bottom Navigation Component
  const BottomNav = () => {
    const navItems = [
      { id: 'home', label: '首頁', icon: '🏠' },
      { id: 'calendar', label: '日誌', icon: '📅' },
      { id: 'workout', label: '健身', icon: '💪' },
      { id: 'diet', label: '飲食', icon: '🍽️' },
      { id: 'metrics', label: '數據', icon: '📊' }
    ];

    return (
      <div className="bottom-nav">
        {navItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <div className="nav-icon">{item.icon}</div>
            <div className="nav-label">{item.label}</div>
          </div>
        ))}
      </div>
    );
  };

  // Render Content Based on Active Tab
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'calendar':
        return <CalendarPage />;
      case 'diet':
        return <DietPage />;
      case 'workout':
        return <WorkoutPage />;
      case 'metrics':
        return <MetricsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="App">
      <div className="main-content">
        {renderContent()}
      </div>
      <BottomNav />
    </div>
  );
}

export default App;
