// script.js

document.addEventListener('DOMContentLoaded', () => {
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskModal = document.getElementById('taskModal');
    const closeTaskModalBtn = document.getElementById('closeTaskModal');
    const taskForm = document.getElementById('taskForm');
    const modalTitle = document.getElementById('modalTitle');
    const taskIdInput = document.getElementById('taskId');
    const taskTitleInput = document.getElementById('taskTitle');
    const taskDescriptionInput = document.getElementById('taskDescription');
    const taskPriorityInput = document.getElementById('taskPriority');
    const taskAssigneeInput = document.getElementById('taskAssignee');
    const deleteTaskBtn = document.getElementById('deleteTaskBtn');

    const historyModal = document.getElementById('historyModal');
    const closeHistoryModalBtn = document.getElementById('closeHistoryModal');
    const historyLog = document.getElementById('historyLog');

    const todoList = document.getElementById('todo-list');
    const inProgressList = document.getElementById('in-progress-list');
    const doneList = document.getElementById('done-list');

    let tasks = loadTasks();
    let draggedTask = null;

    // --- Task Management Functions ---

    function saveTasks() {
        localStorage.setItem('kanbanTasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const storedTasks = localStorage.getItem('kanbanTasks');
        return storedTasks ? JSON.parse(storedTasks) : [];
    }

    function generateUniqueId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

    function createTaskElement(task) {
        const taskCard = document.createElement('div');
        taskCard.classList.add('task-card', 'p-4', 'mb-3', 'rounded-lg', 'shadow-md', 'bg-white', 'hover:shadow-lg', 'transition-all', 'duration-200');
        taskCard.classList.add(`priority-${task.priority.replace(/ /g, '-')}`);
        taskCard.setAttribute('draggable', 'true');
        taskCard.dataset.id = task.id;

        taskCard.innerHTML = `
            <h4 class="font-bold text-lg mb-1 text-gray-800">${task.title}</h4>
            <p class="text-gray-600 text-sm mb-2">${task.description || 'No description'}</p>
            <div class="flex justify-between items-center text-xs text-gray-500">
                <span class="font-semibold">Priority: <span class="text-gray-700">${task.priority}</span></span>
                <span class="font-semibold">Assignee: <span class="text-gray-700">${task.assignee}</span></span>
            </div>
            <div class="flex justify-end mt-3">
                <button class="edit-task-btn bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition-colors mr-2 glass-effect-btn">Edit</button>
                <button class="view-history-btn bg-gray-500 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-600 transition-colors glass-effect-btn">History</button>
            </div>
        `;

        taskCard.addEventListener('dragstart', (e) => {
            draggedTask = taskCard;
            setTimeout(() => taskCard.classList.add('dragging'), 0);
        });

        taskCard.addEventListener('dragend', () => {
            draggedTask.classList.remove('dragging');
            draggedTask = null;
        });

        taskCard.querySelector('.edit-task-btn').addEventListener('click', () => openEditTaskModal(task.id));
        taskCard.querySelector('.view-history-btn').addEventListener('click', () => openHistoryModal(task.id));

        return taskCard;
    }

    function renderTasks() {
        todoList.innerHTML = '';
        inProgressList.innerHTML = '';
        doneList.innerHTML = '';

        tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            if (task.status === 'todo') {
                todoList.appendChild(taskElement);
            } else if (task.status === 'in-progress') {
                inProgressList.appendChild(taskElement);
            } else if (task.status === 'done') {
                doneList.appendChild(taskElement);
            }
        });
    }

    function addTask(title, description, priority, assignee) {
        const now = new Date().toISOString();
        const newTask = {
            id: generateUniqueId(),
            title,
            description,
            priority,
            assignee,
            status: 'todo',
            history: [{
                action: 'created',
                by: assignee,
                timestamp: now,
                details: `Task created by ${assignee}.`
            }]
        };
        tasks.push(newTask);
        saveTasks();
        renderTasks();
        return newTask;
    }

    function updateTask(id, newTitle, newDescription, newPriority, newAssignee) {
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex > -1) {
            const task = tasks[taskIndex];
            const now = new Date().toISOString();
            const changes = [];

            if (task.title !== newTitle) {
                changes.push(`Title changed from '${task.title}' to '${newTitle}'.`);
                task.title = newTitle;
            }
            if (task.description !== newDescription) {
                changes.push(`Description changed.`);
                task.description = newDescription;
            }
            if (task.priority !== newPriority) {
                changes.push(`Priority changed from '${task.priority}' to '${newPriority}'.`);
                task.priority = newPriority;
            }
            if (task.assignee !== newAssignee) {
                changes.push(`Assignee changed from '${task.assignee}' to '${newAssignee}'.`);
                task.assignee = newAssignee;
            }

            if (changes.length > 0) {
                task.history.push({
                    action: 'updated',
                    by: task.assignee, // Assuming the current assignee made the update
                    timestamp: now,
                    details: changes.join(' ')
                });
            }

            saveTasks();
            renderTasks();
        }
    }

    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    }

    // --- Modal Logic ---

    function openAddTaskModal() {
        taskForm.reset();
        taskIdInput.value = '';
        modalTitle.textContent = 'Add New Task';
        deleteTaskBtn.classList.add('hidden');
        taskModal.classList.remove('hidden');
    }

    function openEditTaskModal(id) {
        const task = tasks.find(task => task.id === id);
        if (task) {
            taskIdInput.value = task.id;
            taskTitleInput.value = task.title;
            taskDescriptionInput.value = task.description;
            taskPriorityInput.value = task.priority;
            taskAssigneeInput.value = task.assignee;
            modalTitle.textContent = 'Edit Task';
            deleteTaskBtn.classList.remove('hidden');
            taskModal.classList.remove('hidden');
        }
    }

    function closeTaskModal() {
        taskModal.classList.add('hidden');
    }

    function openHistoryModal(id) {
        const task = tasks.find(task => task.id === id);
        if (task && task.history) {
            historyLog.innerHTML = '';
            task.history.forEach(entry => {
                const historyItem = document.createElement('p');
                historyItem.classList.add('text-sm', 'text-gray-700', 'mb-1');
                const date = new Date(entry.timestamp).toLocaleString();
                historyItem.innerHTML = `<span class="font-semibold">${date}:</span> ${entry.details} <span class="text-gray-500">(${entry.by})</span>`;
                historyLog.appendChild(historyItem);
            });
            historyModal.classList.remove('hidden');
        }
    }

    function closeHistoryModal() {
        historyModal.classList.add('hidden');
    }

    // --- Event Listeners ---

    addTaskBtn.addEventListener('click', openAddTaskModal);
    closeTaskModalBtn.addEventListener('click', closeTaskModal);
    closeHistoryModalBtn.addEventListener('click', closeHistoryModal);

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = taskIdInput.value;
        const title = taskTitleInput.value;
        const description = taskDescriptionInput.value;
        const priority = taskPriorityInput.value;
        const assignee = taskAssigneeInput.value;

        if (id) {
            updateTask(id, title, description, priority, assignee);
        } else {
            addTask(title, description, priority, assignee);
        }
        closeTaskModal();
    });

    deleteTaskBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this task?')) {
            deleteTask(taskIdInput.value);
            closeTaskModal();
        }
    });

    // --- Drag and Drop Logic ---

    const kanbanColumns = document.querySelectorAll('.kanban-column');

    kanbanColumns.forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault(); // Allow drop
            const afterElement = getDragAfterElement(column.querySelector('.task-list'), e.clientY);
            const draggable = document.querySelector('.dragging');
            if (afterElement == null) {
                column.querySelector('.task-list').appendChild(draggable);
            } else {
                column.querySelector('.task-list').insertBefore(draggable, afterElement);
            }
        });

        column.addEventListener('drop', () => {
            if (draggedTask) {
                const taskId = draggedTask.dataset.id;
                const newStatus = column.id.replace('-column', ''); // 'todo', 'in-progress', 'done'
                updateTaskStatus(taskId, newStatus);
            }
        });
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: -Infinity }).element;
    }

    function updateTaskStatus(taskId, newStatus) {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex > -1) {
            const task = tasks[taskIndex];
            if (task.status !== newStatus) {
                const now = new Date().toISOString();
                task.history.push({
                    action: 'status_change',
                    by: task.assignee, // Assuming the assignee or user performing the drag made the change
                    timestamp: now,
                    details: `Task moved from '${task.status}' to '${newStatus}'.`
                });
                task.status = newStatus;
                saveTasks();
                renderTasks();
            }
        }
    }

    // Initial render
    renderTasks();
});
