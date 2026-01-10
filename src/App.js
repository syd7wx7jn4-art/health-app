import { useState } from 'react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [weight, setWeight] = useState(65.5);
  const [kcalIntake, setKcalIntake] = useState(0);
  const [activities, setActivities] = useState(0);

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
    return (
      <div className="calendar-page">
        <div className="page-title">日誌</div>
        <div className="calendar-placeholder">
          <div className="placeholder-text">日曆功能開發中</div>
        </div>
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
