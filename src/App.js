import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [weight, setWeight] = useState(65.5);
  const [kcalIntake, setKcalIntake] = useState(0);
  const [activities, setActivities] = useState(0);
  const [diaryData, setDiaryData] = useState({}); // 儲存每日日誌數據 { date: { calories, protein, carbs, fat, sleep, isGoalMet } }

  // Helper: get today's date string in HK timezone (YYYY-MM-DD)
  const getHKDateStr = (date = new Date()) => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Hong_Kong",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    return `${year}-${month}-${day}`;
  };

  // Helper: format HK display date like: 2026年1月15日（星期四）
  const formatHKDateDisplay = (date = new Date()) => {
    const formatter = new Intl.DateTimeFormat('zh-HK', {
      timeZone: 'Asia/Hong_Kong',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      weekday: 'long'
    });
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === 'year')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const day = parts.find(p => p.type === 'day')?.value || '';
    const weekday = parts.find(p => p.type === 'weekday')?.value || '';
    return `${year}年${month}月${day}日（${weekday}）`;
  };

  // Animated circular progress component
  const CircularRing = ({ value = 0, goal = 100, size = 96, stroke = 8, label = '', unit = '' }) => {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const prevRef = useRef(0);
    const [animatedValue, setAnimatedValue] = useState(0);

    useEffect(() => {
      const from = prevRef.current || 0;
      const to = Math.max(0, Math.min(value, goal));
      const duration = 700; // ms
      const start = performance.now();

      const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      let raf = null;
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = easeInOut(t);
        const current = from + (to - from) * eased;
        setAnimatedValue(current);
        if (t < 1) raf = requestAnimationFrame(step);
        else prevRef.current = to;
      };

      raf = requestAnimationFrame(step);
      return () => raf && cancelAnimationFrame(raf);
    }, [value, goal]);

    const percent = goal > 0 ? Math.max(0, Math.min(1, animatedValue / goal)) : 0;
    const dashOffset = circumference * (1 - percent);

    return (
      <div className="ring-card">
        <svg className="circular-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <g transform={`translate(${size / 2}, ${size / 2})`}>
            <circle
              r={radius}
              fill="transparent"
              stroke="var(--border-light)"
              strokeWidth={stroke}
            />
            <circle
              r={radius}
              fill="transparent"
              stroke="var(--accent-neon)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.1s linear' }}
              transform={`rotate(-90)`}
            />
          </g>
        </svg>

        <div className="ring-text">
          <div className="ring-value">{Math.round(animatedValue)}</div>
          <div className="ring-unit">{unit}</div>
        </div>

        <div className="ring-label">{label} {Math.round(animatedValue)} / {goal} {unit}</div>
      </div>
    );
  };

  // Home Page Component
  const HomePage = () => {
    const todayStr = getHKDateStr();
    const todayData = diaryData[todayStr] || {};
    const protein = todayData.protein || 0;
    const carbs = todayData.carbs || 0;
    const fat = todayData.fat || 0;
    const water = todayData.water || 0;
    const displayDate = formatHKDateDisplay(new Date());

    return (
      <div className="home-page">
        <div className="greeting">{displayDate}</div>

        <div className="top-cards rings-grid stacked">
          <div className="stat-card ring-wrapper">
            <CircularRing value={protein} goal={150} label="蛋白質" unit="g" size={150} stroke={12} />
          </div>

          <div className="stat-card ring-wrapper">
            <CircularRing value={carbs} goal={300} label="碳水" unit="g" size={150} stroke={12} />
          </div>

          <div className="stat-card ring-wrapper">
            <CircularRing value={fat} goal={70} label="脂肪" unit="g" size={150} stroke={12} />
          </div>

          <div className="stat-card ring-wrapper">
            <CircularRing value={water} goal={2000} label="飲水量" unit="mL" size={150} stroke={12} />
          </div>
        </div>
      </div>
    );
  };

  // Calendar Page Component
  const CalendarPage = () => {
    // month navigation
    const getHKNow = () => {
      const now = new Date();
      const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Hong_Kong', year: 'numeric', month: '2-digit', day: '2-digit' });
      const parts = fmt.formatToParts(now);
      const year = parseInt(parts.find(p => p.type === 'year').value);
      const month = parseInt(parts.find(p => p.type === 'month').value) - 1;
      const day = parseInt(parts.find(p => p.type === 'day').value);
      return { year, month, day };
    };

    const hkNow = getHKNow();
    const [currentMonth, setCurrentMonth] = useState({ year: hkNow.year, month: hkNow.month });
    const [selectedDate, setSelectedDate] = useState(() => getHKDateStr());
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({ protein: 0, carbs: 0, fat: 0, sleep: 0, water: 0 });

    const startOfMonth = (y, m) => new Date(y, m, 1);
    const monthLabel = (y, m) => `${y}年${m + 1}月`;

    const prevMonth = () => {
      setCurrentMonth(({ year, month }) => {
        if (month === 0) return { year: year - 1, month: 11 };
        return { year, month: month - 1 };
      });
    };

    const nextMonth = () => {
      setCurrentMonth(({ year, month }) => {
        if (month === 11) return { year: year + 1, month: 0 };
        return { year, month: month + 1 };
      });
    };

    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    const getCalendarMatrix = (year, month) => {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startWeek = firstDay.getDay();
      const cells = [];
      // fill leading empty
      for (let i = 0; i < startWeek; i++) cells.push(null);
      for (let d = 1; d <= daysInMonth; d++) cells.push(d);
      // fill trailing to complete last week
      while (cells.length % 7 !== 0) cells.push(null);
      return cells;
    };

    const cells = getCalendarMatrix(currentMonth.year, currentMonth.month);

    const formatDateKey = (year, month, day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const handleSelectDay = (day) => {
      if (!day) return;
      const key = formatDateKey(currentMonth.year, currentMonth.month, day);
      setSelectedDate(key);
      // load modalData for preview/detail if exists
      const d = diaryData[key] || {};
      setModalData({ protein: d.protein || 0, carbs: d.carbs || 0, fat: d.fat || 0, sleep: d.sleep || 0, water: d.water || 0 });
    };

    // open add modal (for selected date)
    const handleAdd = () => {
      const key = selectedDate || formatDateKey(currentMonth.year, currentMonth.month, 1);
      setSelectedDate(key);
      const d = diaryData[key] || {};
      setModalData({ protein: d.protein || 0, carbs: d.carbs || 0, fat: d.fat || 0, sleep: d.sleep || 0, water: d.water || 0 });
      setShowModal(true);
    };

    const handleSubmit = () => {
      if (!selectedDate) return;
      const newData = { ...diaryData, [selectedDate]: { ...(diaryData[selectedDate] || {}), protein: modalData.protein || 0, carbs: modalData.carbs || 0, fat: modalData.fat || 0, sleep: modalData.sleep || 0, water: modalData.water || 0 } };
      setDiaryData(newData);
      setShowModal(false);
    };

    // helper to get letters for a day
    const getLettersForDay = (year, month, day) => {
      if (!day) return [];
      const key = formatDateKey(year, month, day);
      const d = diaryData[key] || {};
      const res = [];
      if (d.protein) res.push('P');
      if (d.carbs) res.push('C');
      if (d.fat) res.push('F');
      if (d.sleep) res.push('S');
      return res;
    };

    const selectedParts = selectedDate ? selectedDate.split('-').map(Number) : null;
    const detailTitle = selectedParts ? `${String(selectedParts[1]).padStart(2, '0')}月${String(selectedParts[2]).padStart(2, '0')}日 詳細` : '詳細';

    return (
      <div className="calendar-page">
        <div className="page-title" style={{ textAlign: 'center' }}>訓練日誌</div>

        <div className="calendar-container">
          <div className="calendar-topbar">
            <button className="month-nav" onClick={prevMonth}>‹</button>
            <div className="calendar-month-label">{monthLabel(currentMonth.year, currentMonth.month)}</div>
            <button className="month-nav" onClick={nextMonth}>›</button>
          </div>

          <div className="calendar-grid">
            {weekDays.map((w, i) => (
              <div key={i} className="calendar-weekday small">{w}</div>
            ))}

            {cells.map((day, idx) => {
              const isSelectedDay = (() => {
                if (!day) return false;
                const key = formatDateKey(currentMonth.year, currentMonth.month, day);
                return key === selectedDate;
              })();

              const letters = getLettersForDay(currentMonth.year, currentMonth.month, day);

              return (
                <div key={idx} className="calendar-day-wrapper">
                  <div className={`calendar-day ${day ? '' : 'empty'} ${isSelectedDay ? 'selected' : ''}`} onClick={() => handleSelectDay(day)}>
                    <div className="day-number">{day || ''}</div>
                    <div className="day-labels">
                      {['P','C','F','S'].map(l => (
                        <span key={l} className={`day-tag ${letters.includes(l) ? 'active' : 'inactive'} ${l.toLowerCase()}`}>{l}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="calendar-legend">
            <div><span className="legend-dot p"></span> P 蛋白質</div>
            <div><span className="legend-dot c"></span> C 碳水</div>
            <div><span className="legend-dot f"></span> F 脂肪</div>
            <div><span className="legend-dot s"></span> S 睡眠</div>
          </div>

          <div className="detail-card">
            <div className="detail-title">{detailTitle}</div>
            <div className="detail-grid">
              <div className="detail-col">
                <div className="detail-item">
                  <div className="detail-label">蛋白質</div>
                  <div className="detail-value" style={{ color: 'var(--dusty-blue)' }}>{(diaryData[selectedDate] && diaryData[selectedDate].protein) || '-'}g</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">脂肪</div>
                  <div className="detail-value" style={{ color: 'var(--sage-green)' }}>{(diaryData[selectedDate] && diaryData[selectedDate].fat) || '-'}g</div>
                </div>
              </div>

              <div className="detail-col">
                <div className="detail-item">
                  <div className="detail-label">碳水化合物</div>
                  <div className="detail-value" style={{ color: '#2B8BE6' }}>{(diaryData[selectedDate] && diaryData[selectedDate].carbs) || '-'}g</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">睡眠</div>
                  <div className="detail-value" style={{ color: '#7A4BB0' }}>{(diaryData[selectedDate] && diaryData[selectedDate].sleep) || '-'} 小時</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <button className="calendar-add-btn" onClick={handleAdd}>
          <span className="add-btn-icon">+</span>
        </button>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">新增 / 編輯記錄</h3>
                <button className="modal-close-btn" onClick={() => setShowModal(false)}>×</button>
              </div>

              <div className="modal-content">
                <div className="modal-field">
                  <label className="modal-label">蛋白質 (g)</label>
                  <input type="number" className="modal-input" value={modalData.protein} onChange={(e) => setModalData({ ...modalData, protein: parseInt(e.target.value || 0) })} />
                </div>

                <div className="modal-field">
                  <label className="modal-label">碳水化合物 (g)</label>
                  <input type="number" className="modal-input" value={modalData.carbs} onChange={(e) => setModalData({ ...modalData, carbs: parseInt(e.target.value || 0) })} />
                </div>

                <div className="modal-field">
                  <label className="modal-label">脂肪 (g)</label>
                  <input type="number" className="modal-input" value={modalData.fat} onChange={(e) => setModalData({ ...modalData, fat: parseInt(e.target.value || 0) })} />
                </div>

                <div className="modal-field">
                  <label className="modal-label">睡眠 (小時)</label>
                  <input type="number" className="modal-input" value={modalData.sleep} onChange={(e) => setModalData({ ...modalData, sleep: parseFloat(e.target.value || 0) })} />
                </div>

                <div className="modal-field">
                  <label className="modal-label">飲水量 (mL)</label>
                  <input type="number" className="modal-input" value={modalData.water} onChange={(e) => setModalData({ ...modalData, water: parseInt(e.target.value || 0) })} />
                </div>
              </div>

              <div className="modal-footer">
                <button className="modal-submit-btn" onClick={handleSubmit}>保存</button>
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
    const [template, setTemplate] = useState('');

    const handleSave = () => {
      alert(`Exercise: ${exerciseName}\nType: ${workoutType}\nKg: ${kg}\nReps: ${reps}`);
      setActivities(prev => prev + 1);
    };

    // Dynamic Set Table component (inline)
    const DynamicSetTable = ({ initialSets = 3 }) => {
      const [sets, setSets] = useState(
        Array.from({ length: initialSets }, () => ({ weight: '', reps: '', done: false }))
      );

      const updateSet = (index, field, value) => {
        const next = sets.map((s, i) => (i === index ? { ...s, [field]: value } : s));
        setSets(next);
      };

      const toggleDone = (index) => {
        updateSet(index, 'done', !sets[index].done);
      };

      const addSet = () => setSets(prev => [...prev, { weight: '', reps: '', done: false }]);
      const removeSet = (index) => setSets(prev => prev.filter((_, i) => i !== index));

      return (
        <div className="set-table">
          {sets.map((s, idx) => (
            <div key={idx} className={`set-row ${s.done ? 'set-done' : ''}`}>
              <div className="set-cell set-index">{idx + 1}</div>

              <div className="set-cell set-input">
                <input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  value={s.weight}
                  onChange={(e) => updateSet(idx, 'weight', e.target.value)}
                  className="workout-input"
                />
                <span className="unit-label">kg</span>
              </div>

              <div className="set-cell set-input">
                <input
                  type="number"
                  placeholder="0"
                  value={s.reps}
                  onChange={(e) => updateSet(idx, 'reps', e.target.value)}
                  className="workout-input"
                />
                <span className="unit-label">reps</span>
              </div>

              <div className="set-cell set-action">
                <label className="set-checkbox-label">
                  <input
                    type="checkbox"
                    checked={s.done}
                    onChange={() => toggleDone(idx)}
                    className="set-checkbox"
                  />
                </label>
                <button className="remove-set-btn" onClick={() => removeSet(idx)} aria-label={`Remove set ${idx + 1}`}>✕</button>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button className="add-set-btn" onClick={addSet}>Add Set</button>
          </div>
        </div>
      );
    };

    // Custom Plan input with localStorage-backed autocomplete
    const CustomPlanInput = () => {
      const STORAGE_KEY = 'exercise_names_v1';
      const [exerciseNames, setExerciseNames] = useState(() => {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          return raw ? JSON.parse(raw) : [];
        } catch (e) {
          return [];
        }
      });

      const [query, setQuery] = useState('');
      const [showSuggestions, setShowSuggestions] = useState(false);
      const inputRef = useRef(null);

      useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(exerciseNames)); } catch (e) {}
      }, [exerciseNames]);

      const addName = (name) => {
        const trimmed = (name || '').trim();
        if (!trimmed) return;
        setExerciseNames(prev => {
          if (prev.includes(trimmed)) return prev;
          return [trimmed, ...prev].slice(0, 100);
        });
        setQuery('');
        setShowSuggestions(false);
      };

      const removeName = (name) => setExerciseNames(prev => prev.filter(n => n !== name));

      const suggestions = query
        ? exerciseNames.filter(n => n.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
        : exerciseNames.slice(0, 6);

      return (
        <div className="custom-plan">
          <div className="section-title">自定義計畫</div>

          <div className="custom-input-row">
            <input
              ref={inputRef}
              type="text"
              placeholder="輸入運動名稱，按 Enter 新增"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addName(query); } }}
              className="workout-input"
            />
            <button className="add-set-btn" onClick={() => addName(query)}>Add</button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <ul className="suggestions-list">
              {suggestions.map((s, i) => (
                <li key={i} className="suggestion-item" onMouseDown={(e) => { e.preventDefault(); addName(s); }}>
                  {s}
                </li>
              ))}
            </ul>
          )}

          {exerciseNames.length > 0 && (
            <div className="saved-list">
              {exerciseNames.map((n, i) => (
                <div key={i} className="saved-item">
                  <div className="saved-name" onClick={() => { setExerciseName(n); setActiveTab('workout'); }}>{n}</div>
                  <button className="remove-btn" onClick={() => removeName(n)} aria-label={`Remove ${n}`}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
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

          <div style={{ display: 'flex', gap: 12 }}>
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
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Template:
              <select value={template} onChange={(e) => setTemplate(e.target.value)} className="modal-select">
                <option value="">-- Select --</option>
                <option value="push_pull_leg">Push Pull Leg</option>
              </select>
            </label>

            <button className="save-workout-btn" onClick={handleSave}>Save Workout</button>
          </div>

          {/* If a template that needs dynamic sets is selected, show the DynamicSetTable */}
          {template === 'push_pull_leg' && (
            <div style={{ marginTop: 18 }}>
              <DynamicSetTable initialSets={4} />
            </div>
          )}

          <div style={{ marginTop: 18 }}>
            <CustomPlanInput />
          </div>
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
