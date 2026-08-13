"use strict";
// [ĐỊNH NGHĨA KIỂU DỮ LIỆU]
// 1. Khai báo Enum quản lý 3 trạng thái công việc tương ứng với 3 cột
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["TODO"] = "TODO";
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatus["DONE"] = "DONE"; // Trạng thái: Hoàn thành
})(TaskStatus || (TaskStatus = {}));
// 2. Khai báo Enum quản lý 3 mức độ ưu tiên của công việc
var Priority;
(function (Priority) {
    Priority["LOW"] = "LOW";
    Priority["MEDIUM"] = "MEDIUM";
    Priority["HIGH"] = "HIGH"; // Ưu tiên: Cao/Gấp
})(Priority || (Priority = {}));
// 4. Bảng ánh xạ nhãn Tiếng Việt tương ứng cho từng mức độ ưu tiên
const PriorityLabels = {
    [Priority.LOW]: "Thấp",
    [Priority.MEDIUM]: "Trung bình",
    [Priority.HIGH]: "Gấp"
};
// [KHUÔN MẪU LỚP QUẢN LÝ BẢNG KANBAN]
class KanbanBoard {
    tasks = []; // Mảng lưu trữ danh sách các công việc trong bộ nhớ tạm thời
    constructor() {
        this.loadFromLocalStorage(); // Tự động load dữ liệu cũ lên ngay khi khởi tạo đối tượng board
    }
    // Ghi mảng tasks hiện tại vào LocalStorage trình duyệt bằng cách parse sang chuỗi JSON
    saveToLocalStorage() {
        localStorage.setItem('TASKS_DATA', JSON.stringify(this.tasks));
    }
    // Đọc chuỗi JSON từ LocalStorage của trình duyệt và chuyển ngược lại thành mảng tasks
    loadFromLocalStorage() {
        const data = localStorage.getItem('TASKS_DATA'); // Đọc dữ liệu thô
        if (data) {
            this.tasks = JSON.parse(data); // Phục hồi lại mảng
        }
    }
    // Thêm một công việc mới vào danh sách
    addTask(title, description, priority) {
        const newTask = {
            id: Date.now(), // Tạo mã ID ngẫu nhiên không trùng lặp dựa trên thời gian thực
            title,
            description,
            status: TaskStatus.TODO, // Mọi công việc khi vừa tạo mặc định nằm ở cột Cần làm
            priority,
            createdAt: new Date().toLocaleDateString('vi-VN') // Lấy ngày tạo hiện tại của Việt Nam
        };
        this.tasks.push(newTask); // Thêm công việc vừa tạo vào mảng danh sách
        this.saveToLocalStorage(); // Lưu thay đổi xuống trình duyệt
    }
    // Thay đổi cột trạng thái của một công việc
    moveTask(id, newStatus) {
        const task = this.tasks.find(t => t.id === id); // Tìm kiếm công việc khớp ID
        if (task) {
            task.status = newStatus; // Gán lại cột trạng thái mới cho công việc đó
            this.saveToLocalStorage(); // Lưu cập nhật vào LocalStorage
        }
    }
    // Xóa một công việc dựa vào ID của nó
    deleteTask(id) {
        // Lọc bỏ công việc có ID trùng với ID cần xóa, giữ lại những công việc còn lại
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveToLocalStorage(); // Lưu cập nhật xuống trình duyệt
    }
    // Lọc danh sách công việc theo trạng thái tương ứng để phục vụ việc đổ dữ liệu lên cột
    getTasksByStatus(status) {
        return this.tasks.filter(t => t.status === status);
    }
    // Tạo mã HTML động dưới dạng template string cho một chiếc thẻ Task Card
    createTaskCardHTML(task) {
        // Xác định class CSS tương ứng dựa theo mức độ ưu tiên của công việc
        const priorityClass = task.priority === Priority.HIGH ? "p-high" :
            task.priority === Priority.MEDIUM ? "p-medium" : "p-low";
        // Xác định class CSS tương ứng dựa theo trạng thái công việc để hiển thị dấu chấm/tích
        const statusClass = task.status === TaskStatus.TODO ? "status-todo" :
            task.status === TaskStatus.IN_PROGRESS ? "status-doing" : "status-done";
        // Gợi ý tooltip khi di chuột qua dấu tròn trạng thái
        const statusTitle = task.status === TaskStatus.TODO ? "Trạng thái: Cần làm" :
            task.status === TaskStatus.IN_PROGRESS ? "Trạng thái: Đang làm" : "Trạng thái: Hoàn thành";
        // Trả về chuỗi HTML chứa đầy đủ thông tin của công việc
        return `
        <div class="task-card" data-id="${task.id}" draggable="true">
                <div class="card-header">
                    <div class="card-header-left">
                        <h4>${task.title}</h4>
                        <!-- Badge màu hiển thị độ ưu tiên tương ứng -->
                        <span class="badge ${priorityClass}">${PriorityLabels[task.priority]}</span>
                    </div>
                    <!-- Dấu chấm trạng thái hiển thị ở góc trên bên phải tiêu đề -->
                    <span class="status-indicator ${statusClass}" title="${statusTitle}"></span>
                </div>
                <p class="card-desc">${task.description || "Không có mô tả"}</p>
                <div class="card-footer">
                    <small>${task.createdAt}</small>
                    <!-- Nút xóa hiển thị ở góc phải dưới. Nếu công việc đã DONE thì ẩn nút đi bằng visibility: hidden để giữ vững layout -->
                    <button class="btn-delete-task" data-id="${task.id}" title="Xóa công việc" style="${task.status === TaskStatus.DONE ? 'visibility: hidden;' : ''}">✕</button>
                </div>
            </div>
        `;
    }
    // Thực hiện đổ dữ liệu HTML động và cập nhật bộ đếm lên giao diện màn hình
    render(colTodo, colDoing, colDone, countTodo, countDoing, countDone) {
        // Lọc ra 3 mảng công việc tương ứng với 3 cột
        const todoList = this.getTasksByStatus(TaskStatus.TODO);
        const doingList = this.getTasksByStatus(TaskStatus.IN_PROGRESS);
        const doneList = this.getTasksByStatus(TaskStatus.DONE);
        // Chuyển mảng công việc thành các thẻ HTML và gán vào các container cột tương ứng
        colTodo.innerHTML = todoList.map(t => this.createTaskCardHTML(t)).join('');
        colDoing.innerHTML = doingList.map(t => this.createTaskCardHTML(t)).join('');
        colDone.innerHTML = doneList.map(t => this.createTaskCardHTML(t)).join('');
        // Cập nhật số lượng công việc hiển thị lên các bong bóng đếm ở tiêu đề cột
        countTodo.textContent = todoList.length.toString();
        countDoing.textContent = doingList.length.toString();
        countDone.textContent = doneList.length.toString();
    }
}
// [KẾT NỐI VÀ LẤY CÁC PHẦN TỬ DOM TỪ FILE HTML SANG TYPESCRIPT]
// Lấy các input nhập liệu và nút Thêm công việc
const inputTitle = document.getElementById("taskTitle");
const inputDesc = document.getElementById("taskDesc");
const inputPriority = document.getElementById("taskPriority");
const btnAddTask = document.getElementById("addTaskBtn");
// Lấy 3 ô container chứa danh sách công việc của từng cột
const colTodo = document.getElementById("colTodo");
const colDoing = document.getElementById("colDoing");
const colDone = document.getElementById("colDone");
// Lấy 3 thẻ hiển thị số lượng công việc ở đầu mỗi cột
const countTodo = document.getElementById("countTodo");
const countDoing = document.getElementById("countDoing");
const countDone = document.getElementById("countDone");
// Lấy thẻ div cha lớn chứa toàn bộ các cột Kanban
const kanbanBoard = document.querySelector(".kanban-board");
// Khởi tạo đối tượng board từ class KanbanBoard vừa định nghĩa
const board = new KanbanBoard();
// Định nghĩa hàm trung gian gọi lệnh render để cập nhật toàn bộ bảng Kanban
const renderBoard = () => {
    board.render(colTodo, colDoing, colDone, countTodo, countDoing, countDone);
};
// Gọi hiển thị bảng Kanban lần đầu tiên khi trang vừa tải xong
renderBoard();
// ----------------------------------------
// [LẮNG NGHE VÀ XỬ LÝ CÁC SỰ KIỆN TỪ GIAO DIỆN]
// 1. Xử lý sự kiện khi người dùng Click vào nút "Thêm công việc"
btnAddTask.addEventListener("click", () => {
    const title = inputTitle.value.trim(); // Lấy giá trị tiêu đề công việc, cắt khoảng trắng ở 2 đầu
    const description = inputDesc.value.trim(); // Lấy giá trị mô tả
    const priority = inputPriority.value; // Lấy mức độ ưu tiên được chọn
    // Kiểm tra nếu tiêu đề trống thì yêu cầu người dùng nhập và dừng xử lý
    if (!title) {
        alert("Vui lòng nhập tiêu đề công việc!");
        return;
    }
    board.addTask(title, description, priority); // Thêm công việc mới vào cơ sở dữ liệu
    renderBoard(); // Vẽ lại giao diện bảng để cập nhật thẻ mới
    // Xóa sạch các nội dung đã nhập trong form để chuẩn bị cho lần nhập tiếp theo
    inputTitle.value = "";
    inputDesc.value = "";
    inputTitle.focus(); // Đặt lại con trỏ chuột tập trung vào ô tiêu đề
    inputPriority.value = Priority.MEDIUM; // Reset độ ưu tiên về mặc định là Trung bình
});
// 2. Xử lý sự kiện khi người dùng click vào nút xóa "✕" của một thẻ công việc bất kỳ
// Sử dụng cơ chế Event Delegation (ủy quyền sự kiện) gán sự kiện cho thẻ cha kanbanBoard
kanbanBoard.addEventListener("click", (e) => {
    const target = e.target; // Lấy ra phần tử thực tế bị click trúng
    // Kiểm tra nếu phần tử bị click trúng chứa class "btn-delete-task"
    if (target.classList.contains("btn-delete-task")) {
        const id = Number(target.getAttribute("data-id")); // Lấy ID của công việc từ thuộc tính data-id
        if (!isNaN(id)) {
            board.deleteTask(id); // Gọi hàm xóa công việc khỏi danh sách
            renderBoard(); // Vẽ lại giao diện mới sau khi xóa
        }
    }
});
// 3. Xử lý tính năng Kéo và Thả công việc (Drag and Drop) giữa các cột
let draggedTaskId = null; // Biến toàn cục lưu trữ ID của công việc đang được kéo đi
// Sự kiện 3.1: Khi người dùng bắt đầu nhấn giữ chuột kéo một thẻ công việc đi (dragstart)
kanbanBoard.addEventListener("dragstart", (e) => {
    // Tìm thẻ .task-card gần nhất chứa phần tử đang kéo
    const target = e.target.closest(".task-card");
    if (target) {
        draggedTaskId = Number(target.getAttribute("data-id")); // Lưu lại ID của công việc đang được kéo
        // Sử dụng setTimeout để tránh làm mất touch target trên thiết bị di động
        setTimeout(() => {
            target.classList.add("dragging"); // Thêm class "dragging" để đổi style mờ thẻ đi
        }, 0);
    }
});
// Sự kiện 3.2: Khi người dùng nhả chuột dừng kéo thẻ công việc (dragend)
kanbanBoard.addEventListener("dragend", (e) => {
    const target = e.target.closest(".task-card");
    if (target) {
        target.classList.remove("dragging"); // Xóa bỏ class "dragging" trả lại trạng thái hiển thị rõ nét
    }
    // Dọn dẹp, xóa bỏ class hiệu ứng viền nét đứt ở tất cả các cột
    document.querySelectorAll(".task-list").forEach(list => list.classList.remove("drag-over"));
});
// Lấy danh sách tất cả các cột có class .column trên giao diện
const columns = document.querySelectorAll(".column");
// Bảng ánh xạ ID của danh sách với Enum trạng thái tương ứng của công việc
const statusMap = {
    "colTodo": TaskStatus.TODO,
    "colDoing": TaskStatus.IN_PROGRESS,
    "colDone": TaskStatus.DONE
};
// Đăng ký các sự kiện Drag & Drop trên từng Cột để đảm bảo nhận diện chính xác kể cả khi cuộn trang
columns.forEach(column => {
    const list = column.querySelector(".task-list");
    if (!list)
        return;
    // Sự kiện 3.3: Khi rê thẻ đang kéo bay ngang qua cột (dragover)
    column.addEventListener("dragover", (e) => {
        e.preventDefault(); // Ngăn chặn hành động mặc định của trình duyệt để cho phép thả (drop) thẻ vào đây
        list.classList.add("drag-over"); // Hiển thị màu nền nhạt và viền nét đứt màu tím
    });
    // Sự kiện 3.4: Khi rê thẻ đang kéo ra khỏi phạm vi của cột (dragleave)
    column.addEventListener("dragleave", (e) => {
        // Chỉ xóa class viền nét đứt nếu con trỏ chuột thực sự đã đi ra ngoài hoàn toàn khỏi khối cột
        if (!column.contains(e.relatedTarget)) {
            list.classList.remove("drag-over");
        }
    });
    // Sự kiện 3.5: Khi nhả chuột thả thẻ công việc rơi vào cột (drop)
    column.addEventListener("drop", (e) => {
        e.preventDefault();
        list.classList.remove("drag-over"); // Xóa bỏ viền nét đứt
        if (draggedTaskId !== null) {
            const newStatus = statusMap[list.id]; // Tìm kiếm xem cột thả vào có trạng thái tương ứng là gì
            if (newStatus) {
                board.moveTask(draggedTaskId, newStatus); // Chuyển đổi trạng thái mới cho công việc trong mảng & localStorage
                renderBoard(); // Vẽ lại giao diện cột với vị trí công việc mới
            }
            draggedTaskId = null; // Reset biến ID công việc đang kéo về null
        }
    });
});
