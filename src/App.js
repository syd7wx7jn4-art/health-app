import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [weight, setWeight] = useState(65.5);
  const [kcalIntake, setKcalIntake] = useState(0);
  const [activities, setActivities] = useState(0);
  const [diaryData, setDiaryData] = useState({}); // 儲存每日日誌數據 { date: { calories, protein, carbs, fat, sleep, isGoalMet } }
  // Weekly routine and training logs (persisted locally)
  const [weeklyRoutine, setWeeklyRoutine] = useState(() => {
    try {
      const raw = localStorage.getItem('weeklyRoutine_v1');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      sun: { label: '', exercises: [] },
      mon: { label: '', exercises: [] },
      tue: { label: '', exercises: [] },
      wed: { label: '', exercises: [] },
      thu: { label: '', exercises: [] },
      fri: { label: '', exercises: [] },
      sat: { label: '', exercises: [] }
    };
  });

  const [trainingLogs, setTrainingLogs] = useState(() => {
    try {
      const raw = localStorage.getItem('trainingLogs_v1');
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  });

  // User profile / Settings state
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const raw = localStorage.getItem('userProfile_v1');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { name: 'John Doe', tagline: '健身愛好者', trainingYears: 3, avatarUrl: '', notificationsEnabled: true };
  });

  useEffect(() => {
    try { localStorage.setItem('userProfile_v1', JSON.stringify(userProfile)); } catch (e) {}
  }, [userProfile]);

  const logout = () => {
    console.log('logout');
    // placeholder: clear session/localStorage as needed
    // localStorage.removeItem('userProfile_v1');
    setActiveTab('home');
  };

  /**
   * Daily targets for Home rings. Kept in App state so other pages can read/write.
   * Type (for future TS):
   * type DailyTargets = {
   *   proteinTarget: number;
   *   carbsTarget: number;
   *   fatTarget: number;
   *   waterTargetMl: number;
   * }
   */
  const [dailyTargets, setDailyTargets] = useState(() => {
    try {
      const raw = localStorage.getItem('dailyTargets_v1');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { proteinTarget: 150, carbsTarget: 300, fatTarget: 70, waterTargetMl: 2000 };
  });

  useEffect(() => {
    try { localStorage.setItem('dailyTargets_v1', JSON.stringify(dailyTargets)); } catch (e) {}
  }, [dailyTargets]);

  useEffect(() => {
    try { localStorage.setItem('weeklyRoutine_v1', JSON.stringify(weeklyRoutine)); } catch (e) {}
  }, [weeklyRoutine]);

  useEffect(() => {
    try { localStorage.setItem('trainingLogs_v1', JSON.stringify(trainingLogs)); } catch (e) {}
  }, [trainingLogs]);

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
    const [showTargetsModal, setShowTargetsModal] = useState(false);
    const [tempTargets, setTempTargets] = useState(() => ({ ...dailyTargets }));

    useEffect(() => {
      setTempTargets({ ...dailyTargets });
    }, [dailyTargets]);

    const openTargets = () => setShowTargetsModal(true);
    const closeTargets = () => {
      setTempTargets({ ...dailyTargets });
      setShowTargetsModal(false);
    };

    const saveTargets = () => {
      const cleaned = {
        proteinTarget: parseInt(tempTargets.proteinTarget || 0),
        carbsTarget: parseInt(tempTargets.carbsTarget || 0),
        fatTarget: parseInt(tempTargets.fatTarget || 0),
        waterTargetMl: parseInt(tempTargets.waterTargetMl || 0)
      };
      setDailyTargets(cleaned);
      setShowTargetsModal(false);
    };

    return (
      <div className="home-page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="greeting">{displayDate}</div>
          <button className="profile-edit-btn" onClick={openTargets} style={{ fontSize: 14, padding: 8 }}>編輯目標</button>
        </div>

        <div className="top-cards rings-grid stacked">
          <div className="stat-card ring-wrapper">
            <CircularRing value={protein} goal={dailyTargets.proteinTarget} label="蛋白質" unit="g" size={150} stroke={12} />
          </div>

          <div className="stat-card ring-wrapper">
            <CircularRing value={carbs} goal={dailyTargets.carbsTarget} label="碳水" unit="g" size={150} stroke={12} />
          </div>

          <div className="stat-card ring-wrapper">
            <CircularRing value={fat} goal={dailyTargets.fatTarget} label="脂肪" unit="g" size={150} stroke={12} />
          </div>

          <div className="stat-card ring-wrapper">
            <CircularRing value={water} goal={dailyTargets.waterTargetMl} label="飲水量" unit="mL" size={150} stroke={12} />
          </div>
        </div>

        {showTargetsModal && (
          <div className="modal-overlay" onClick={closeTargets}>
            <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">編輯每日目標</h3>
                <button className="modal-close-btn" onClick={closeTargets}>×</button>
              </div>

              <div className="modal-content">
                <div className="modal-field">
                  <label className="modal-label">蛋白質目標 (g)</label>
                  <input type="number" className="modal-input" value={tempTargets.proteinTarget} onChange={(e)=>setTempTargets({...tempTargets, proteinTarget: e.target.value})} />
                </div>

                <div className="modal-field">
                  <label className="modal-label">碳水目標 (g)</label>
                  <input type="number" className="modal-input" value={tempTargets.carbsTarget} onChange={(e)=>setTempTargets({...tempTargets, carbsTarget: e.target.value})} />
                </div>

                <div className="modal-field">
                  <label className="modal-label">脂肪目標 (g)</label>
                  <input type="number" className="modal-input" value={tempTargets.fatTarget} onChange={(e)=>setTempTargets({...tempTargets, fatTarget: e.target.value})} />
                </div>

                <div className="modal-field">
                  <label className="modal-label">飲水量目標 (mL)</label>
                  <input type="number" className="modal-input" value={tempTargets.waterTargetMl} onChange={(e)=>setTempTargets({...tempTargets, waterTargetMl: e.target.value})} />
                </div>
              </div>

              <div className="modal-footer">
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="modal-submit-btn" style={{ background: 'transparent', border: '1px solid var(--border-light)' }} onClick={closeTargets}>取消</button>
                  <button className="modal-submit-btn" onClick={saveTargets}>儲存目標</button>
                </div>
              </div>
            </div>
          </div>
        )}
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
    const [modalData, setModalData] = useState({ protein: 0, carbs: 0, fat: 0, water: 0 });

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
      setModalData({ protein: d.protein || 0, carbs: d.carbs || 0, fat: d.fat || 0, water: d.water || 0 });
    };

    // open add modal (for selected date)
    const handleAdd = () => {
      const key = selectedDate || formatDateKey(currentMonth.year, currentMonth.month, 1);
      setSelectedDate(key);
      const d = diaryData[key] || {};
      setModalData({ protein: d.protein || 0, carbs: d.carbs || 0, fat: d.fat || 0, water: d.water || 0 });
      setShowModal(true);
    };

    const handleSubmit = () => {
      if (!selectedDate) return;
      const newData = { ...diaryData, [selectedDate]: { ...(diaryData[selectedDate] || {}), protein: modalData.protein || 0, carbs: modalData.carbs || 0, fat: modalData.fat || 0, water: modalData.water || 0 } };
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
      if (d.water) res.push('W');
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
              if (!day) return (<div key={idx} className="calendar-day-wrapper"><div className="calendar-day empty" /></div>);

              const key = formatDateKey(currentMonth.year, currentMonth.month, day);
              const isSelectedDay = key === selectedDate;
              const d = diaryData[key] || {};

              return (
                <div key={idx} className="calendar-day-wrapper">
                  <div className="calendar-day" onClick={() => handleSelectDay(day)}>
                    <div className={`day-number ${isSelectedDay ? 'selected' : ''}`}>{day}</div>
                  </div>
                </div>
              );
            })}
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
                  <div className="detail-label">飲水量</div>
                  <div className="detail-value" style={{ color: '#7A4BB0' }}>{(diaryData[selectedDate] && diaryData[selectedDate].water) || '-'} mL</div>
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
    const makeDefaultMeal = (i) => ({ id: `meal-${i+1}`, name: `Meal ${i+1}`, protein: '', fat: '', carbs: '' });
    const [meals, setMeals] = useState(() => [0,1,2,3].map((i) => makeDefaultMeal(i)));

    const updateMealField = (id, field, value) => {
      setMeals(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const renameMeal = (id, name) => updateMealField(id, 'name', name);

    const addMeal = () => {
      setMeals(prev => {
        const nextIndex = prev.length + 1;
        return [...prev, makeDefaultMeal(nextIndex)];
      });
    };

    const deleteMeal = (id) => {
      setMeals(prev => {
        if (prev.length <= 1) return prev; // keep at least one
        return prev.filter(m => m.id !== id);
      });
    };

    return (
      <div className="diet-page">
        <div className="page-title">飲食記錄</div>

        <div className="meals-list">
          {meals.map((meal, idx) => (
            <div className="meal-section" key={meal.id}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <input className="meal-title-input" value={meal.name} onChange={(e) => renameMeal(meal.id, e.target.value)} />
                <button className="remove-set-btn" onClick={() => deleteMeal(meal.id)} title="Delete Meal">🗑</button>
              </div>

              <div className="photo-analysis">
                <div className="photo-placeholder">📷 Photo Analysis</div>
              </div>

              <div className="macros-input">
                <input
                  type="number"
                  placeholder="Protein (g)"
                  value={meal.protein}
                  onChange={(e) => updateMealField(meal.id, 'protein', e.target.value)}
                  className="macro-input"
                />

                <input
                  type="number"
                  placeholder="Fat (g)"
                  value={meal.fat}
                  onChange={(e) => updateMealField(meal.id, 'fat', e.target.value)}
                  className="macro-input"
                />

                <input
                  type="number"
                  placeholder="Carbs (g)"
                  value={meal.carbs}
                  onChange={(e) => updateMealField(meal.id, 'carbs', e.target.value)}
                  className="macro-input"
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          <button className="add-set-btn" onClick={addMeal}>+ 新增 Meal</button>
        </div>
      </div>
    );
  };

  // Workout Page Component -> Routine / Today
  const WorkoutPage = () => {
    const days = [
      { key: 'sun', label: '日' },
      { key: 'mon', label: '一' },
      { key: 'tue', label: '二' },
      { key: 'wed', label: '三' },
      { key: 'thu', label: '四' },
      { key: 'fri', label: '五' },
      { key: 'sat', label: '六' }
    ];

    const getHKDayKey = (date = new Date()) => {
      const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Hong_Kong', weekday: 'short' });
      // weekday short returns Sun, Mon ... we map by index instead
      const d = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }));
      const idx = d.getDay();
      return ['sun','mon','tue','wed','thu','fri','sat'][idx];
    };

    const [active, setActive] = useState('routine'); // 'routine' | 'today'
    const [editingDay, setEditingDay] = useState(getHKDayKey());

    // Routine Tab components and helpers
    const RoutineTab = () => {
      const dayKey = editingDay;
      const dayData = weeklyRoutine[dayKey] || { label: '', exercises: [] };
      const [label, setLabel] = useState(dayData.label || '');
      const [exercises, setExercises] = useState(() => JSON.parse(JSON.stringify(dayData.exercises || [])));

      useEffect(() => {
        setLabel(dayData.label || '');
        setExercises(JSON.parse(JSON.stringify(dayData.exercises || [])));
      }, [editingDay]);

      const addExercise = () => setExercises(prev => [...prev, { name: '', sets: [{ weight: '', reps: '' }] }]);
      const deleteExercise = (idx) => setExercises(prev => prev.filter((_, i) => i !== idx));
      const updateExerciseName = (idx, value) => setExercises(prev => prev.map((ex,i) => i===idx?{...ex,name:value}:ex));

      const addSet = (exIdx) => setExercises(prev => prev.map((ex,i) => i===exIdx?{...ex,sets:[...ex.sets,{weight:'',reps:''}]}:ex));
      const removeSet = (exIdx, setIdx) => setExercises(prev => prev.map((ex,i) => i===exIdx?{...ex,sets:ex.sets.filter((_,s)=>s!==setIdx)}:ex));
      const updateSetField = (exIdx, setIdx, field, value) => setExercises(prev => prev.map((ex,i)=> i===exIdx?{...ex,sets:ex.sets.map((s,si)=>si===setIdx?{...s,[field]:value}:s)}:ex));

      const saveDay = () => {
        setWeeklyRoutine(prev => ({ ...prev, [dayKey]: { label, exercises } }));
      };

      return (
        <div className="routine-tab">
          <div className="weekday-selector">
            {days.map(d => (
              <button key={d.key} className={`weekday-btn ${editingDay===d.key? 'active':''}`} onClick={() => setEditingDay(d.key)}>{d.label}</button>
            ))}
          </div>

          <div className="routine-card">
            <input className="routine-label-input" placeholder="當日訓練名稱 (例如 Push Day)" value={label} onChange={(e)=>setLabel(e.target.value)} />

            <div className="exercises-list">
              {exercises.map((ex, exIdx) => (
                <div className="exercise-card" key={exIdx}>
                  <div className="exercise-header">
                    <input className="exercise-name" placeholder="Exercise Name" value={ex.name} onChange={(e)=>updateExerciseName(exIdx, e.target.value)} />
                    <button className="remove-set-btn" onClick={()=>deleteExercise(exIdx)}>Delete Exercise</button>
                  </div>

                  <div className="sets-table">
                    {ex.sets.map((s, si) => (
                      <div className="set-row" key={si}>
                        <div className="set-index">{si+1}</div>
                        <input className="set-input" type="number" placeholder="Kg" value={s.weight} onChange={(e)=>updateSetField(exIdx, si, 'weight', e.target.value)} />
                        <input className="set-input" type="number" placeholder="Reps" value={s.reps} onChange={(e)=>updateSetField(exIdx, si, 'reps', e.target.value)} />
                        <button className="remove-set-btn" onClick={()=>removeSet(exIdx, si)}>Remove</button>
                      </div>
                    ))}

                    <div style={{ marginTop: 8 }}>
                      <button className="add-set-btn" onClick={()=>addSet(exIdx)}>Add Set</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <button className="add-set-btn" onClick={addExercise}>+ 新增動作</button>
            </div>

            <div style={{ marginTop: 16 }}>
              <button className="save-workout-btn" onClick={saveDay}>儲存當日 Routine</button>
            </div>
          </div>
        </div>
      );
    };

    // Today Tab
    const TodayTab = () => {
      const todayKey = getHKDayKey();
      const dateKey = getHKDateStr();
      const routine = weeklyRoutine[todayKey] || { label: '', exercises: [] };

      const [session, setSession] = useState(() => {
        const saved = trainingLogs[dateKey];
        if (saved) return JSON.parse(JSON.stringify(saved));
        // create from routine
        return { label: routine.label || '', exercises: (routine.exercises || []).map(ex => ({ name: ex.name, sets: (ex.sets||[]).map(s => ({ weight: s.weight || '', reps: s.reps || '', done: false })) })) };
      });

      useEffect(()=>{
        // update when switching or routine changes
        const saved = trainingLogs[dateKey];
        if (saved) setSession(JSON.parse(JSON.stringify(saved)));
        else setSession({ label: routine.label || '', exercises: (routine.exercises || []).map(ex => ({ name: ex.name, sets: (ex.sets||[]).map(s => ({ weight: s.weight || '', reps: s.reps || '', done: false })) })) });
      }, [weeklyRoutine, dateKey]);

      const updateSessionField = (exIdx, setIdx, field, value) => setSession(prev => ({ ...prev, exercises: prev.exercises.map((ex,i)=> i===exIdx?{...ex,sets:ex.sets.map((st,si)=> si===setIdx?{...st,[field]:value}:st)}:ex)}));
      const toggleDone = (exIdx, setIdx) => setSession(prev => ({ ...prev, exercises: prev.exercises.map((ex,i)=> i===exIdx?{...ex,sets:ex.sets.map((st,si)=> si===setIdx?{...st,done:!st.done}:st)}:ex)}));

      const saveWorkout = () => {
        setTrainingLogs(prev => ({ ...prev, [dateKey]: session }));
        setActivities(prev => prev + 1);
        alert('訓練紀錄已儲存');
      };

      if (!routine || (routine.exercises||[]).length === 0) {
        return (
          <div className="today-empty">
            <div className="page-title">{`今天 · ${formatHKDateDisplay(new Date()).split('（')[0]}`}</div>
            <div style={{ padding: 12, marginTop: 12 }}>今天未設定訓練計畫，前往 Routine 分頁建立一週排程。</div>
            <div style={{ marginTop: 12 }}>
              <button className="add-set-btn" onClick={() => { setActive('routine'); setEditingDay(getHKDayKey()); }}>建立 Routine</button>
            </div>
          </div>
        );
      }

      const hkWeekdayName = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' })).getDay()];

      return (
        <div className="today-tab">
          <div className="page-title">{`${hkWeekdayName} · ${routine.label}`}</div>
          <div className="routine-card">
            {session.exercises.map((ex, exIdx) => (
              <div className="exercise-card" key={exIdx}>
                <div className="exercise-header">
                  <div className="exercise-name-display">{ex.name}</div>
                </div>
                <div className="sets-table">
                  {ex.sets.map((s, si) => (
                    <div className="set-row" key={si}>
                      <div className="set-index">{si+1}</div>
                      <input className="set-input" type="number" value={s.weight} onChange={(e)=>updateSessionField(exIdx, si, 'weight', e.target.value)} />
                      <input className="set-input" type="number" value={s.reps} onChange={(e)=>updateSessionField(exIdx, si, 'reps', e.target.value)} />
                      <input type="checkbox" checked={!!s.done} onChange={()=>toggleDone(exIdx, si)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ marginTop: 16 }}>
              <button className="save-workout-btn" onClick={saveWorkout}>Save Workout</button>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="workout-page">
        <div className="page-title">健身記錄</div>
        <div className="workout-toggle">
          <button className={`toggle-btn ${active==='routine'?'active':''}`} onClick={()=>setActive('routine')}>Routine</button>
          <button className={`toggle-btn ${active==='today'?'active':''}`} onClick={()=>setActive('today')}>Today</button>
        </div>

        <div style={{ marginTop: 12 }}>
          {active==='routine' ? <RoutineTab /> : <TodayTab />}
        </div>
      </div>
    );
  };

  // Metrics Page removed per request

  // Settings Page Component (Profile + Preferences)
  const SettingsPage = () => {
    const fileInputRef = useRef(null);

    const handleAvatarClick = () => {
      fileInputRef.current && fileInputRef.current.click();
    };

    const handleAvatarFile = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setUserProfile(prev => ({ ...prev, avatarUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    };

    const updateProfileField = (field, value) => setUserProfile(prev => ({ ...prev, [field]: value }));

    return (
      <div className="settings-page">
        <div className="page-title">設定</div>

        <div className="profile-card">
          <div className="profile-left">
            <div className="avatar" onClick={handleAvatarClick}>
              {userProfile.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt="avatar" />
              ) : (
                <div className="avatar-initials">{(userProfile.name || 'JD').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()}</div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFile} />
          </div>

          <div className="profile-right">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <input className="profile-name-input" value={userProfile.name} onChange={(e)=>updateProfileField('name', e.target.value)} />
              <button className="profile-edit-btn" onClick={() => console.log('Open profile editor')}>編輯</button>
            </div>

            <input className="profile-tagline-input" value={userProfile.tagline} onChange={(e)=>updateProfileField('tagline', e.target.value)} />

            <div className="profile-row">
              <label className="profile-row-label">健身年資</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input className="profile-years-input" type="number" min="0" value={userProfile.trainingYears} onChange={(e)=>updateProfileField('trainingYears', parseInt(e.target.value || 0))} />
                <span className="profile-years-unit">年</span>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">帳戶</div>
          <div className="settings-list">
            <div className="settings-item" onClick={()=>console.log('Open Personal Info')}>
              <div className="settings-left"><span className="settings-icon">👤</span><span>個人資料</span></div>
              <div className="settings-right">›</div>
            </div>

            <div className="settings-item">
              <div className="settings-left"><span className="settings-icon">🔔</span><span>通知設定</span></div>
              <div className="settings-right">
                <label className="switch">
                  <input type="checkbox" checked={!!userProfile.notificationsEnabled} onChange={(e)=>updateProfileField('notificationsEnabled', e.target.checked)} />
                  <span className="slider" />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">其他</div>
          <div className="settings-list">
            <div className="settings-item" onClick={()=>console.log('Privacy Policy')}>
              <div className="settings-left"><span className="settings-icon">🔒</span><span>隱私權政策</span></div>
              <div className="settings-right">›</div>
            </div>
            <div className="settings-item" onClick={()=>console.log('Help & Support')}>
              <div className="settings-left"><span className="settings-icon">❓</span><span>幫助與支援</span></div>
              <div className="settings-right">›</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div className="logout-card">
            <button className="logout-btn" onClick={logout}><span className="logout-icon">⎋</span> 登出</button>
          </div>
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
      
      { id: 'settings', label: '設定', icon: '⚙️' }
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
      case 'settings':
        return <SettingsPage />;
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
