# Machine Coding Questions (1-2 Hour Problems)

## 1. Build a Todo Application with localStorage

**Requirements:**
- Add, edit, delete todos
- Mark as complete/incomplete
- Filter by status (All, Active, Completed)
- Persist to localStorage
- Clean UI

**Solution:**

```javascript
// HTML
const html = `
<div class="todo-app">
  <div class="todo-header">
    <h1>Todos</h1>
    <div class="input-group">
      <input type="text" id="todoInput" placeholder="Add a new todo...">
      <button id="addBtn">Add</button>
    </div>
  </div>
  
  <div class="filters">
    <button class="filter-btn active" data-filter="all">All</button>
    <button class="filter-btn" data-filter="active">Active</button>
    <button class="filter-btn" data-filter="completed">Completed</button>
  </div>
  
  <ul id="todoList"></ul>
  <div id="stats"></div>
</div>
`;

// JavaScript
class TodoApp {
  constructor() {
    this.todos = this.loadTodos();
    this.filter = 'all';
    this.init();
  }
  
  init() {
    this.attachEventListeners();
    this.render();
  }
  
  attachEventListeners() {
    document.getElementById('addBtn').addEventListener('click', () => this.addTodo());
    document.getElementById('todoInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addTodo();
    });
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.filter = e.target.dataset.filter;
        this.render();
      });
    });
    
    document.getElementById('todoList').addEventListener('click', (e) => {
      const todoId = e.target.closest('li')?.dataset.id;
      if (e.target.classList.contains('checkbox')) {
        this.toggleTodo(todoId);
      } else if (e.target.classList.contains('edit-btn')) {
        this.editTodo(todoId);
      } else if (e.target.classList.contains('delete-btn')) {
        this.deleteTodo(todoId);
      }
    });
  }
  
  addTodo() {
    const input = document.getElementById('todoInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    const todo = {
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date()
    };
    
    this.todos.push(todo);
    this.saveTodos();
    this.render();
    input.value = '';
  }
  
  toggleTodo(id) {
    const todo = this.todos.find(t => t.id === parseInt(id));
    if (todo) {
      todo.completed = !todo.completed;
      this.saveTodos();
      this.render();
    }
  }
  
  deleteTodo(id) {
    this.todos = this.todos.filter(t => t.id !== parseInt(id));
    this.saveTodos();
    this.render();
  }
  
  editTodo(id) {
    const todo = this.todos.find(t => t.id === parseInt(id));
    if (todo) {
      const newText = prompt('Edit todo:', todo.text);
      if (newText !== null && newText.trim()) {
        todo.text = newText.trim();
        this.saveTodos();
        this.render();
      }
    }
  }
  
  getFilteredTodos() {
    switch(this.filter) {
      case 'active':
        return this.todos.filter(t => !t.completed);
      case 'completed':
        return this.todos.filter(t => t.completed);
      default:
        return this.todos;
    }
  }
  
  render() {
    const todoList = document.getElementById('todoList');
    const filtered = this.getFilteredTodos();
    
    todoList.innerHTML = filtered.map(todo => `
      <li data-id="${todo.id}" class="todo-item ${todo.completed ? 'completed' : ''}">
        <input type="checkbox" class="checkbox" ${todo.completed ? 'checked' : ''}>
        <span class="todo-text">${this.escapeHtml(todo.text)}</span>
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </li>
    `).join('');
    
    this.updateStats();
  }
  
  updateStats() {
    const total = this.todos.length;
    const completed = this.todos.filter(t => t.completed).length;
    const active = total - completed;
    
    document.getElementById('stats').innerHTML = `
      Total: ${total} | Active: ${active} | Completed: ${completed}
    `;
  }
  
  saveTodos() {
    localStorage.setItem('todos', JSON.stringify(this.todos));
  }
  
  loadTodos() {
    const saved = localStorage.getItem('todos');
    return saved ? JSON.parse(saved) : [];
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize
new TodoApp();
```

---

## 2. Implement a Shopping Cart

**Requirements:**
- Add/remove items
- Update quantities
- Calculate total price
- Apply discount coupon
- Save cart state
- Show notifications

**Solution:**

```javascript
class ShoppingCart {
  constructor() {
    this.items = this.loadCart();
    this.coupons = {
      'SAVE10': 0.10,
      'SAVE20': 0.20,
      'SAVE50': 0.50
    };
    this.appliedCoupon = null;
    this.init();
  }
  
  init() {
    this.attachEventListeners();
    this.render();
  }
  
  attachEventListeners() {
    document.getElementById('addToCart').addEventListener('click', () => {
      const productId = document.getElementById('productSelect').value;
      const quantity = parseInt(document.getElementById('quantity').value);
      this.addItem(productId, quantity);
    });
    
    document.getElementById('applyCoupon').addEventListener('click', () => {
      const coupon = document.getElementById('couponInput').value;
      this.applyCoupon(coupon);
    });
    
    document.getElementById('cart').addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-btn')) {
        this.removeItem(e.target.dataset.itemId);
      } else if (e.target.classList.contains('qty-decrease')) {
        this.updateQuantity(e.target.dataset.itemId, -1);
      } else if (e.target.classList.contains('qty-increase')) {
        this.updateQuantity(e.target.dataset.itemId, 1);
      }
    });
  }
  
  addItem(productId, quantity) {
    if (quantity <= 0) return;
    
    const existingItem = this.items.find(item => item.productId === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      const product = this.getProduct(productId);
      this.items.push({
        productId,
        name: product.name,
        price: product.price,
        quantity
      });
    }
    
    this.saveCart();
    this.render();
    this.showNotification(`Added ${quantity} item(s) to cart`);
  }
  
  removeItem(productId) {
    this.items = this.items.filter(item => item.productId !== productId);
    this.saveCart();
    this.render();
  }
  
  updateQuantity(productId, delta) {
    const item = this.items.find(i => i.productId === productId);
    if (item) {
      item.quantity += delta;
      if (item.quantity <= 0) {
        this.removeItem(productId);
      } else {
        this.saveCart();
        this.render();
      }
    }
  }
  
  applyCoupon(coupon) {
    if (this.coupons[coupon]) {
      this.appliedCoupon = coupon;
      this.showNotification(`Coupon ${coupon} applied!`);
      this.render();
    } else {
      this.showNotification('Invalid coupon', 'error');
    }
  }
  
  getDiscount() {
    if (!this.appliedCoupon) return 0;
    return this.getSubtotal() * this.coupons[this.appliedCoupon];
  }
  
  getSubtotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }
  
  getTotal() {
    return this.getSubtotal() - this.getDiscount();
  }
  
  render() {
    const cartHtml = this.items.map(item => `
      <div class="cart-item">
        <span>${item.name}</span>
        <span>$${item.price.toFixed(2)}</span>
        <div class="quantity-control">
          <button class="qty-decrease" data-item-id="${item.productId}">-</button>
          <span>${item.quantity}</span>
          <button class="qty-increase" data-item-id="${item.productId}">+</button>
        </div>
        <span>$${(item.price * item.quantity).toFixed(2)}</span>
        <button class="remove-btn" data-item-id="${item.productId}">Remove</button>
      </div>
    `).join('');
    
    const subtotal = this.getSubtotal();
    const discount = this.getDiscount();
    const total = this.getTotal();
    
    document.getElementById('cart').innerHTML = `
      ${cartHtml}
      <div class="cart-summary">
        <div>Subtotal: $${subtotal.toFixed(2)}</div>
        ${this.appliedCoupon ? `<div>Discount (${this.appliedCoupon}): -$${discount.toFixed(2)}</div>` : ''}
        <div class="total">Total: $${total.toFixed(2)}</div>
      </div>
    `;
  }
  
  saveCart() {
    localStorage.setItem('cart', JSON.stringify(this.items));
  }
  
  loadCart() {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  }
  
  getProduct(productId) {
    // Mock data
    const products = {
      '1': { name: 'Laptop', price: 999 },
      '2': { name: 'Phone', price: 699 },
      '3': { name: 'Headphones', price: 199 }
    };
    return products[productId];
  }
  
  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
  }
}

new ShoppingCart();
```

---

## 3. Build a Poll/Survey Application

**Requirements:**
- Create polls with multiple options
- Vote on polls
- Show live results
- Prevent duplicate votes
- Display percentages
- Real-time updates

**Solution:**

```javascript
class PollApp {
  constructor() {
    this.polls = this.loadPolls();
    this.userVotes = this.loadUserVotes();
    this.init();
  }
  
  init() {
    this.render();
    this.attachEventListeners();
  }
  
  attachEventListeners() {
    document.getElementById('createPoll').addEventListener('click', () => {
      this.showCreateModal();
    });
  }
  
  createPoll(question, options) {
    const poll = {
      id: Date.now(),
      question,
      options: options.map(option => ({
        text: option,
        votes: 0
      })),
      totalVotes: 0
    };
    
    this.polls.push(poll);
    this.savePolls();
    this.render();
  }
  
  vote(pollId, optionIndex) {
    const key = `poll_${pollId}`;
    
    if (this.userVotes[key] !== undefined) {
      alert('You already voted on this poll!');
      return;
    }
    
    const poll = this.polls.find(p => p.id === pollId);
    if (poll) {
      poll.options[optionIndex].votes++;
      poll.totalVotes++;
      
      this.userVotes[key] = optionIndex;
      this.saveUserVotes();
      this.savePolls();
      this.render();
    }
  }
  
  getPercentage(votes, total) {
    if (total === 0) return 0;
    return ((votes / total) * 100).toFixed(1);
  }
  
  render() {
    const container = document.getElementById('polls');
    
    container.innerHTML = this.polls.map(poll => {
      const userVoted = this.userVotes[`poll_${poll.id}`] !== undefined;
      const userVoteIndex = this.userVotes[`poll_${poll.id}`];
      
      return `
        <div class="poll">
          <h3>${poll.question}</h3>
          <div class="options">
            ${poll.options.map((option, index) => {
              const percentage = this.getPercentage(option.votes, poll.totalVotes);
              const isUserVote = userVoteIndex === index;
              
              return `
                <div class="option ${isUserVote ? 'user-voted' : ''}">
                  <div class="option-text">
                    ${option.text}
                    <span class="votes">${option.votes} votes (${percentage}%)</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress" style="width: ${percentage}%"></div>
                  </div>
                  ${!userVoted ? `
                    <button onclick="pollApp.vote(${poll.id}, ${index})">Vote</button>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
          <div class="total-votes">Total votes: ${poll.totalVotes}</div>
        </div>
      `;
    }).join('');
  }
  
  showCreateModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>Create Poll</h2>
        <input type="text" id="pollQuestion" placeholder="Poll question">
        <div id="options">
          <input type="text" class="option-input" placeholder="Option 1">
          <input type="text" class="option-input" placeholder="Option 2">
        </div>
        <button id="addOption">+ Add Option</button>
        <button id="submitPoll">Create Poll</button>
        <button id="closePoll">Cancel</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('addOption').addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'option-input';
      input.placeholder = `Option ${document.querySelectorAll('.option-input').length + 1}`;
      document.getElementById('options').appendChild(input);
    });
    
    document.getElementById('submitPoll').addEventListener('click', () => {
      const question = document.getElementById('pollQuestion').value;
      const options = Array.from(document.querySelectorAll('.option-input'))
        .map(input => input.value)
        .filter(val => val.trim());
      
      if (question && options.length >= 2) {
        this.createPoll(question, options);
        modal.remove();
      } else {
        alert('Please enter a question and at least 2 options');
      }
    });
    
    document.getElementById('closePoll').addEventListener('click', () => modal.remove());
  }
  
  savePolls() {
    localStorage.setItem('polls', JSON.stringify(this.polls));
  }
  
  loadPolls() {
    const saved = localStorage.getItem('polls');
    return saved ? JSON.parse(saved) : [];
  }
  
  saveUserVotes() {
    localStorage.setItem('userVotes', JSON.stringify(this.userVotes));
  }
  
  loadUserVotes() {
    const saved = localStorage.getItem('userVotes');
    return saved ? JSON.parse(saved) : {};
  }
}

const pollApp = new PollApp();
```

---

## 4. Build a Stopwatch/Timer Application

**Requirements:**
- Start, pause, stop, reset
- Lap functionality
- Milliseconds display
- Responsive UI
- Sound notification on completion

**Solution:**

```javascript
class Stopwatch {
  constructor() {
    this.isRunning = false;
    this.elapsedTime = 0; // milliseconds
    this.laps = [];
    this.startTime = null;
    this.pausedTime = 0;
    this.init();
  }
  
  init() {
    this.attachEventListeners();
    this.updateDisplay();
  }
  
  attachEventListeners() {
    document.getElementById('start').addEventListener('click', () => this.start());
    document.getElementById('pause').addEventListener('click', () => this.pause());
    document.getElementById('reset').addEventListener('click', () => this.reset());
    document.getElementById('lap').addEventListener('click', () => this.recordLap());
  }
  
  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.startTime = Date.now() - this.pausedTime;
      this.animationId = setInterval(() => this.tick(), 10);
      this.updateButtons();
    }
  }
  
  pause() {
    if (this.isRunning) {
      this.isRunning = false;
      this.pausedTime = this.elapsedTime;
      clearInterval(this.animationId);
      this.updateButtons();
    }
  }
  
  reset() {
    this.isRunning = false;
    this.elapsedTime = 0;
    this.laps = [];
    this.pausedTime = 0;
    clearInterval(this.animationId);
    this.updateDisplay();
    this.updateButtons();
    this.renderLaps();
  }
  
  tick() {
    this.elapsedTime = Date.now() - this.startTime;
    this.updateDisplay();
  }
  
  recordLap() {
    if (this.isRunning || this.elapsedTime > 0) {
      this.laps.push({
        lapTime: this.elapsedTime,
        lapDuration: this.laps.length > 0 
          ? this.elapsedTime - this.laps[this.laps.length - 1].lapTime
          : this.elapsedTime
      });
      this.renderLaps();
    }
  }
  
  formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
  }
  
  updateDisplay() {
    document.getElementById('display').textContent = this.formatTime(this.elapsedTime);
  }
  
  updateButtons() {
    const startBtn = document.getElementById('start');
    const pauseBtn = document.getElementById('pause');
    const lapBtn = document.getElementById('lap');
    
    if (this.isRunning) {
      startBtn.disabled = true;
      pauseBtn.disabled = false;
      lapBtn.disabled = false;
    } else {
      startBtn.disabled = false;
      pauseBtn.disabled = true;
      lapBtn.disabled = this.elapsedTime === 0;
    }
  }
  
  renderLaps() {
    const lapsList = document.getElementById('laps');
    
    if (this.laps.length === 0) {
      lapsList.innerHTML = '<p>No laps recorded</p>';
      return;
    }
    
    lapsList.innerHTML = this.laps.map((lap, index) => `
      <div class="lap">
        <span>Lap ${index + 1}</span>
        <span>${this.formatTime(lap.lapDuration)}</span>
        <span>${this.formatTime(lap.lapTime)}</span>
      </div>
    `).join('');
  }
}

new Stopwatch();
```

---

## 5. Build a Weather Application

**Requirements:**
- Fetch weather from API (OpenWeatherMap)
- Search by city
- Display current weather
- Show 5-day forecast
- Favorites management
- Temperature unit toggle
- Error handling

**Solution:**

```javascript
class WeatherApp {
  constructor() {
    this.apiKey = 'YOUR_API_KEY';
    this.favorites = this.loadFavorites();
    this.tempUnit = 'C';
    this.init();
  }
  
  init() {
    this.attachEventListeners();
    this.loadDefaultCity('London');
  }
  
  attachEventListeners() {
    document.getElementById('searchBtn').addEventListener('click', () => this.search());
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.search();
    });
    
    document.getElementById('tempToggle').addEventListener('click', () => {
      this.tempUnit = this.tempUnit === 'C' ? 'F' : 'C';
      this.render();
    });
  }
  
  async search() {
    const city = document.getElementById('searchInput').value;
    if (city.trim()) {
      await this.loadWeather(city);
    }
  }
  
  async loadWeather(city) {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${this.apiKey}&units=metric`
      );
      
      if (!response.ok) throw new Error('City not found');
      
      const data = await response.json();
      this.currentWeather = data;
      
      // Get forecast
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${this.apiKey}&units=metric`
      );
      const forecastData = await forecastResponse.json();
      this.forecast = forecastData;
      
      this.render();
    } catch (error) {
      alert('Error fetching weather: ' + error.message);
    }
  }
  
  loadDefaultCity(city) {
    this.loadWeather(city);
  }
  
  convertTemp(celsius) {
    if (this.tempUnit === 'F') {
      return Math.round((celsius * 9/5) + 32);
    }
    return Math.round(celsius);
  }
  
  render() {
    if (!this.currentWeather) return;
    
    const weather = this.currentWeather;
    const temp = this.convertTemp(weather.main.temp);
    
    document.getElementById('weather-info').innerHTML = `
      <div class="weather-current">
        <h2>${weather.name}, ${weather.sys.country}</h2>
        <div class="temp">${temp}°${this.tempUnit}</div>
        <div class="description">${weather.weather[0].description}</div>
        <div class="details">
          <div>Feels like: ${this.convertTemp(weather.main.feels_like)}°</div>
          <div>Humidity: ${weather.main.humidity}%</div>
          <div>Wind: ${weather.wind.speed} m/s</div>
        </div>
      </div>
    `;
    
    this.renderForecast();
  }
  
  renderForecast() {
    if (!this.forecast) return;
    
    const dailyForecasts = {};
    
    this.forecast.list.forEach(item => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = item;
      }
    });
    
    const forecastHtml = Object.values(dailyForecasts)
      .slice(0, 5)
      .map(day => `
        <div class="forecast-day">
          <div>${new Date(day.dt * 1000).toLocaleDateString()}</div>
          <div>${this.convertTemp(day.main.temp)}°${this.tempUnit}</div>
          <div>${day.weather[0].main}</div>
        </div>
      `)
      .join('');
    
    document.getElementById('forecast').innerHTML = forecastHtml;
  }
  
  addFavorite() {
    if (this.currentWeather) {
      const favorite = {
        id: Date.now(),
        city: this.currentWeather.name,
        country: this.currentWeather.sys.country
      };
      
      if (!this.favorites.some(f => f.city === favorite.city)) {
        this.favorites.push(favorite);
        this.saveFavorites();
        alert('Added to favorites!');
      }
    }
  }
  
  saveFavorites() {
    localStorage.setItem('weatherFavorites', JSON.stringify(this.favorites));
  }
  
  loadFavorites() {
    const saved = localStorage.getItem('weatherFavorites');
    return saved ? JSON.parse(saved) : [];
  }
}

new WeatherApp();
```

These machine coding problems cover common full-stack scenarios and test your ability to build complete, functional applications within time constraints.
