// Todo App - Production Level Implementation
class TodoApp {
  constructor() {
    this.todos = [];
    this.currentFilter = "all";
    this.editingIndex = null;

    // DOM Elements
    this.todoForm = document.getElementById("todo-form");
    this.todoInput = document.getElementById("todo-input");
    this.todoList = document.getElementById("todo-list");
    this.totalTasks = document.getElementById("total-tasks");
    this.completedTasks = document.getElementById("completed-tasks");
    this.clearCompletedBtn = document.getElementById("clear-completed");
    this.emptyState = document.getElementById("empty-state");
    this.editModal = document.getElementById("edit-modal");
    this.editInput = document.getElementById("edit-input");

    this.initializeApp();
    this.bindEvents();
  }

  initializeApp() {
    try {
      this.loadTodos();
      this.renderTodos();
      this.updateStats();
      this.showEmptyState();
    } catch (error) {
      console.error("Error initializing app:", error);
      this.showNotification(
        "Error loading todos. Please refresh the page.",
        "error"
      );
    }
  }

  bindEvents() {
    // Form submission
    this.todoForm.addEventListener("submit", (e) => this.handleAddTodo(e));

    // Filter buttons
    document.querySelectorAll(".btn-filter").forEach((btn) => {
      btn.addEventListener("click", (e) => this.handleFilterChange(e));
    });

    // Clear completed
    this.clearCompletedBtn.addEventListener("click", () =>
      this.clearCompleted()
    );

    // Modal events
    document
      .querySelector(".modal-close")
      .addEventListener("click", () => this.closeModal());
    document
      .getElementById("cancel-edit")
      .addEventListener("click", () => this.closeModal());
    document
      .getElementById("save-edit")
      .addEventListener("click", () => this.saveEdit());

    // Close modal on outside click
    this.editModal.addEventListener("click", (e) => {
      if (e.target === this.editModal) this.closeModal();
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) =>
      this.handleKeyboardShortcuts(e)
    );
  }

  handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "Enter":
          e.preventDefault();
          this.todoForm.dispatchEvent(new Event("submit"));
          break;
        case "Escape":
          this.closeModal();
          break;
      }
    }
  }

  async handleAddTodo(e) {
    e.preventDefault();

    const text = this.todoInput.value.trim();
    if (!text) return;

    try {
      const todo = {
        id: this.generateId(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.todos.unshift(todo);
      this.saveTodos();
      this.renderTodos();
      this.updateStats();
      this.showEmptyState();

      this.todoInput.value = "";
      this.todoInput.focus();

      this.showNotification("Task added successfully!", "success");
    } catch (error) {
      console.error("Error adding todo:", error);
      this.showNotification("Error adding task. Please try again.", "error");
    }
  }

  handleFilterChange(e) {
    const filter = e.target.dataset.filter;
    if (filter === this.currentFilter) return;

    // Update active filter button
    document.querySelectorAll(".btn-filter").forEach((btn) => {
      btn.classList.remove("active");
    });
    e.target.classList.add("active");

    this.currentFilter = filter;
    this.renderTodos();
  }

  toggleTodo(id) {
    try {
      const todo = this.todos.find((t) => t.id === id);
      if (todo) {
        todo.completed = !todo.completed;
        todo.updatedAt = new Date().toISOString();
        this.saveTodos();
        this.renderTodos();
        this.updateStats();
        this.showNotification(
          todo.completed
            ? "Task marked as completed!"
            : "Task marked as active!",
          "success"
        );
      }
    } catch (error) {
      console.error("Error toggling todo:", error);
      this.showNotification("Error updating task. Please try again.", "error");
    }
  }

  editTodo(id) {
    try {
      const todo = this.todos.find((t) => t.id === id);
      if (todo) {
        this.editingIndex = this.todos.indexOf(todo);
        this.editInput.value = todo.text;
        this.editInput.focus();
        this.editInput.select();
        this.showModal();
      }
    } catch (error) {
      console.error("Error editing todo:", error);
      this.showNotification("Error editing task. Please try again.", "error");
    }
  }

  saveEdit() {
    try {
      const newText = this.editInput.value.trim();
      if (!newText) return;

      if (this.editingIndex !== null && this.editingIndex >= 0) {
        this.todos[this.editingIndex].text = newText;
        this.todos[this.editingIndex].updatedAt = new Date().toISOString();
        this.saveTodos();
        this.renderTodos();
        this.closeModal();
        this.showNotification("Task updated successfully!", "success");
      }
    } catch (error) {
      console.error("Error saving edit:", error);
      this.showNotification("Error updating task. Please try again.", "error");
    }
  }

  deleteTodo(id) {
    try {
      const todo = this.todos.find((t) => t.id === id);
      if (todo) {
        if (confirm(`Are you sure you want to delete "${todo.text}"?`)) {
          this.todos = this.todos.filter((t) => t.id !== id);
          this.saveTodos();
          this.renderTodos();
          this.updateStats();
          this.showEmptyState();
          this.showNotification("Task deleted successfully!", "success");
        }
      }
    } catch (error) {
      console.error("Error deleting todo:", error);
      this.showNotification("Error deleting task. Please try again.", "error");
    }
  }

  clearCompleted() {
    try {
      const completedCount = this.todos.filter((t) => t.completed).length;
      if (completedCount === 0) {
        this.showNotification("No completed tasks to clear.", "info");
        return;
      }

      if (
        confirm(
          `Are you sure you want to delete ${completedCount} completed task(s)?`
        )
      ) {
        this.todos = this.todos.filter((t) => !t.completed);
        this.saveTodos();
        this.renderTodos();
        this.updateStats();
        this.showEmptyState();
        this.showNotification(
          `${completedCount} completed task(s) cleared!`,
          "success"
        );
      }
    } catch (error) {
      console.error("Error clearing completed todos:", error);
      this.showNotification(
        "Error clearing completed tasks. Please try again.",
        "error"
      );
    }
  }

  renderTodos() {
    try {
      this.todoList.innerHTML = "";

      const filteredTodos = this.getFilteredTodos();

      if (filteredTodos.length === 0) {
        this.showEmptyState();
        return;
      }

      filteredTodos.forEach((todo) => {
        const li = this.createTodoElement(todo);
        this.todoList.appendChild(li);
      });
    } catch (error) {
      console.error("Error rendering todos:", error);
      this.showNotification(
        "Error displaying tasks. Please refresh the page.",
        "error"
      );
    }
  }

  createTodoElement(todo) {
    const li = document.createElement("li");
    li.className = `todo-item ${todo.completed ? "completed" : ""}`;
    li.dataset.id = todo.id;

    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-checkbox";
    checkbox.checked = todo.completed;
    checkbox.addEventListener("change", () => this.toggleTodo(todo.id));

    // Todo text
    const textSpan = document.createElement("span");
    textSpan.className = "todo-text";
    textSpan.textContent = todo.text;
    textSpan.addEventListener("click", () => this.editTodo(todo.id));

    // Actions
    const actions = document.createElement("span");
    actions.className = "todo-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.title = "Edit task";
    editBtn.addEventListener("click", () => this.editTodo(todo.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.title = "Delete task";
    deleteBtn.addEventListener("click", () => this.deleteTodo(todo.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(textSpan);
    li.appendChild(actions);

    return li;
  }

  getFilteredTodos() {
    switch (this.currentFilter) {
      case "active":
        return this.todos.filter((t) => !t.completed);
      case "completed":
        return this.todos.filter((t) => t.completed);
      default:
        return this.todos;
    }
  }

  updateStats() {
    try {
      const total = this.todos.length;
      const completed = this.todos.filter((t) => t.completed).length;

      this.totalTasks.textContent = total;
      this.completedTasks.textContent = completed;

      // Update clear completed button state
      this.clearCompletedBtn.disabled = completed === 0;
      this.clearCompletedBtn.style.opacity = completed === 0 ? "0.5" : "1";
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  }

  showEmptyState() {
    try {
      const hasTodos = this.todos.length > 0;
      const hasFilteredTodos = this.getFilteredTodos().length > 0;

      if (!hasTodos) {
        this.emptyState.style.display = "block";
        this.todoList.style.display = "none";
      } else if (!hasFilteredTodos) {
        this.emptyState.style.display = "block";
        this.todoList.style.display = "none";
        this.emptyState.innerHTML = `
          <i class="fas fa-filter"></i>
          <h3>No ${this.currentFilter} tasks</h3>
          <p>Try changing the filter or add new tasks!</p>
        `;
      } else {
        this.emptyState.style.display = "none";
        this.todoList.style.display = "block";
      }
    } catch (error) {
      console.error("Error showing empty state:", error);
    }
  }

  showModal() {
    this.editModal.style.display = "block";
    document.body.style.overflow = "hidden";
  }

  closeModal() {
    this.editModal.style.display = "none";
    document.body.style.overflow = "auto";
    this.editingIndex = null;
    this.editInput.value = "";
  }

  // LocalStorage Operations
  saveTodos() {
    try {
      localStorage.setItem("todos", JSON.stringify(this.todos));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
      throw new Error("Failed to save todos to localStorage");
    }
  }

  loadTodos() {
    try {
      const stored = localStorage.getItem("todos");
      if (stored) {
        this.todos = JSON.parse(stored);
        // Validate and clean data
        this.todos = this.todos.filter(
          (todo) =>
            todo &&
            typeof todo === "object" &&
            todo.id &&
            todo.text &&
            typeof todo.text === "string" &&
            todo.text.trim().length > 0
        );
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      // Clear corrupted data
      localStorage.removeItem("todos");
      this.todos = [];
      throw new Error("Failed to load todos from localStorage");
    }
  }

  // Utility Methods
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="fas fa-${this.getNotificationIcon(type)}"></i>
      <span>${message}</span>
      <button class="notification-close">&times;</button>
    `;

    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${this.getNotificationColor(type)};
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 10px;
      max-width: 400px;
      animation: slideInRight 0.3s ease;
    `;

    // Add close button functionality
    const closeBtn = notification.querySelector(".notification-close");
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      margin-left: auto;
    `;
    closeBtn.addEventListener("click", () => notification.remove());

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = "slideOutRight 0.3s ease";
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }

  getNotificationIcon(type) {
    switch (type) {
      case "success":
        return "check-circle";
      case "error":
        return "exclamation-circle";
      case "warning":
        return "exclamation-triangle";
      default:
        return "info-circle";
    }
  }

  getNotificationColor(type) {
    switch (type) {
      case "success":
        return "#28a745";
      case "error":
        return "#dc3545";
      case "warning":
        return "#ffc107";
      default:
        return "#17a2b8";
    }
  }
}

// Add notification animations to CSS
const notificationStyles = document.createElement("style");
notificationStyles.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(notificationStyles);

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  try {
    new TodoApp();
  } catch (error) {
    console.error("Failed to initialize TodoApp:", error);
    document.body.innerHTML = `
      <div style="text-align: center; padding: 50px; color: white;">
        <h1>Error Loading Todo App</h1>
        <p>Something went wrong while loading the application.</p>
        <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 20px; border: none; border-radius: 5px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    `;
  }
});
