// [ĐỊNH NGHĨA KIỂU DỮ LIỆU]
// 1. Khai báo Enum quản lý 3 trạng thái công việc tương ứng với 3 cột
enum TaskStatus {
    TODO = "TODO",                 // Trạng thái: Cần làm
    IN_PROGRESS = "IN_PROGRESS",   // Trạng thái: Đang làm
    DONE = "DONE"                  // Trạng thái: Hoàn thành
}

// 2. Khai báo Enum quản lý 3 mức độ ưu tiên của công việc
enum Priority {
    LOW = "LOW",                   // Ưu tiên: Thấp
    MEDIUM = "MEDIUM",             // Ưu tiên: Trung bình
    HIGH = "HIGH"                  // Ưu tiên: Cao/Gấp
}

// 3. Khai báo cấu trúc đối tượng Task (Công việc) bằng Interface
interface Task {
    id: number;                    // Mã định danh duy nhất (dùng timestamp Date.now())
    title: string;                 // Tiêu đề của công việc
    description: string;           // Mô tả nội dung công việc
    status: TaskStatus;            // Cột trạng thái công việc hiện tại
    priority: Priority;            // Mức độ ưu tiên của công việc
    createdAt: string;             // Ngày tạo công việc (định dạng dd/mm/yyyy)
}

// 4. Bảng ánh xạ nhãn Tiếng Việt tương ứng cho từng mức độ ưu tiên
const PriorityLabels: Record<Priority, string> = {
    [Priority.LOW]: "Thấp",
    [Priority.MEDIUM]: "Trung bình",
    [Priority.HIGH]: "Gấp"
};

// [KHUÔN MẪU LỚP QUẢN LÝ BẢNG KANBAN]
class KanbanBoard {
    private tasks: Task[] = [];    // Mảng lưu trữ danh sách các công việc trong bộ nhớ tạm thời

    constructor() {
        this.loadFromLocalStorage(); // Tự động load dữ liệu cũ lên ngay khi khởi tạo đối tượng board
    }

    // Ghi mảng tasks hiện tại vào LocalStorage trình duyệt bằng cách parse sang chuỗi JSON
    private saveToLocalStorage(): void {
        localStorage.setItem('TASKS_DATA', JSON.stringify(this.tasks));
    }

    // Đọc chuỗi JSON từ LocalStorage của trình duyệt và chuyển ngược lại thành mảng tasks
    private loadFromLocalStorage(): void {
        const data = localStorage.getItem('TASKS_DATA'); // Đọc dữ liệu thô
        if (data) {
            this.tasks = JSON.parse(data); // Phục hồi lại mảng
        }
    }

    // Thêm một công việc mới vào danh sách
    addTask(title: string, description: string, priority: Priority): void {
        const newTask: Task = {
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
    moveTask(id: number, newStatus: TaskStatus): void {
        const task = this.tasks.find(t => t.id === id); // Tìm kiếm công việc khớp ID
        if (task) {
            task.status = newStatus; // Gán lại cột trạng thái mới cho công việc đó
            this.saveToLocalStorage(); // Lưu cập nhật vào LocalStorage
        }
    }

    // Xóa một công việc dựa vào ID của nó
    deleteTask(id: number): void {
        // Lọc bỏ công việc có ID trùng với ID cần xóa, giữ lại những công việc còn lại
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveToLocalStorage(); // Lưu cập nhật xuống trình duyệt
    }

    // Lọc danh sách công việc theo trạng thái tương ứng để phục vụ việc đổ dữ liệu lên cột
    getTasksByStatus(status: TaskStatus): Task[] {
        return this.tasks.filter(t => t.status === status);
    }

    // Tạo mã HTML động dưới dạng template string cho một chiếc thẻ Task Card
    private createTaskCardHTML(task: Task): string {
        // Xác định class CSS tương ứng dựa theo mức độ ưu tiên của công việc
        const priorityClass = task.priority === Priority.HIGH ? "p-high" :
            task.priority === Priority.MEDIUM ? "p-medium" : "p-low";

        // Xác định class CSS tương ứng dựa theo trạng thái công việc để hiển thị dấu chấm/tích
        const statusClass = task.status === TaskStatus.TODO ? "status-todo" :
            task.status === TaskStatus.IN_PROGRESS ? "status-doing" : "status-done";

        // Gợi ý tooltip khi di chuột qua dấu tròn trạng thái (cột DONE gợi ý click để xóa)
        const statusTitle = task.status === TaskStatus.TODO ? "Trạng thái: Cần làm" :
            task.status === TaskStatus.IN_PROGRESS ? "Trạng thái: Đang làm" : "Click để xóa công việc đã hoàn thành";

        // Trả về chuỗi HTML chứa đầy đủ thông tin của công việc
        return `
        <div class="task-card" data-id="${task.id}">
                <div class="card-header">
                    <div class="card-header-left">
                        <!-- Icon tay cầm kéo ⋮⋮ chuẩn UX di động cho phép kéo thả chính xác mà không làm cản trở cuộn trang -->
                        <span class="drag-handle" title="Kéo để di chuyển">⋮⋮</span>
                        <h4>${task.title}</h4>
                        <!-- Badge màu hiển thị độ ưu tiên tương ứng -->
                        <span class="badge ${priorityClass}">${PriorityLabels[task.priority]}</span>
                    </div>
                    <!-- Dấu tích xanh ở góc trên bên phải tiêu đề: ở cột HOÀN THÀNH click vào sẽ xóa công việc -->
                    <span class="status-indicator ${statusClass}" title="${statusTitle}"></span>
                </div>
                <p class="card-desc">${task.description || "Không có mô tả"}</p>
                <div class="card-footer">
                    <small>${task.createdAt}</small>
                    <!-- Nút xóa ✕ ở footer. Nếu công việc đã DONE thì ẩn nút đi để dùng duy nhất dấu tích xanh ở header, tránh bị trùng -->
                    <button class="btn-delete-task" data-id="${task.id}" title="Xóa công việc" style="${task.status === TaskStatus.DONE ? 'visibility: hidden;' : ''}">✕</button>
                </div>
            </div>
        `;
    }

    // Thực hiện đổ dữ liệu HTML động và cập nhật bộ đếm lên giao diện màn hình
    render(
        colTodo: HTMLElement,
        colDoing: HTMLElement,
        colDone: HTMLElement,
        countTodo: HTMLElement,
        countDoing: HTMLElement,
        countDone: HTMLElement
    ): void {
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
const inputTitle = document.getElementById("taskTitle") as HTMLInputElement;
const inputDesc = document.getElementById("taskDesc") as HTMLInputElement;
const inputPriority = document.getElementById("taskPriority") as HTMLSelectElement;
const btnAddTask = document.getElementById("addTaskBtn") as HTMLButtonElement;

// Lấy 3 ô container chứa danh sách công việc của từng cột
const colTodo = document.getElementById("colTodo") as HTMLElement;
const colDoing = document.getElementById("colDoing") as HTMLElement;
const colDone = document.getElementById("colDone") as HTMLElement;

// Lấy 3 thẻ hiển thị số lượng công việc ở đầu mỗi cột
const countTodo = document.getElementById("countTodo") as HTMLElement;
const countDoing = document.getElementById("countDoing") as HTMLElement;
const countDone = document.getElementById("countDone") as HTMLElement;

// Lấy thẻ div cha lớn chứa toàn bộ các cột Kanban
const kanbanBoard = document.querySelector(".kanban-board") as HTMLDivElement;

// Khởi tạo đối tượng board từ class KanbanBoard vừa định nghĩa
const board = new KanbanBoard();

// Định nghĩa hàm trung gian gọi lệnh render để cập nhật toàn bộ bảng Kanban
const renderBoard = () => {
    board.render(colTodo, colDoing, colDone, countTodo, countDoing, countDone);
}

// Gọi hiển thị bảng Kanban lần đầu tiên khi trang vừa tải xong
renderBoard();

// ----------------------------------------
// [LẮNG NGHE VÀ XỬ LÝ CÁC SỰ KIỆN TỪ GIAO DIỆN]

// 1. Xử lý sự kiện khi người dùng Click vào nút "Thêm công việc"
btnAddTask.addEventListener("click", () => {
    const title = inputTitle.value.trim(); // Lấy giá trị tiêu đề công việc, cắt khoảng trắng ở 2 đầu
    const description = inputDesc.value.trim(); // Lấy giá trị mô tả
    const priority = inputPriority.value as Priority; // Lấy mức độ ưu tiên được chọn

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

// 2. Xử lý sự kiện khi người dùng click vào nút xóa "✕" hoặc dấu tích xanh "✓" của công việc
// Sử dụng cơ chế Event Delegation (ủy quyền sự kiện) gán sự kiện cho thẻ cha kanbanBoard
kanbanBoard.addEventListener("click", (e: Event) => {
    const target = e.target as HTMLElement; // Lấy ra phần tử thực tế bị click trúng

    // Nếu click nút btn-delete-task (bao gồm cả nút ✓ ở cột Hoàn thành) hoặc dấu tích xanh ở header
    if (target.classList.contains("btn-delete-task") || target.classList.contains("status-done")) {
        const card = target.closest(".task-card");
        if (card) {
            const id = Number(card.getAttribute("data-id"));
            if (!isNaN(id)) {
                board.deleteTask(id); // Gọi hàm xóa công việc khỏi danh sách
                renderBoard(); // Vẽ lại giao diện mới sau khi xóa
            }
        }
    }
});

// --------------------------------------------------------------------------
// 3. XỬ LÝ TÍNH NĂNG KÉO THẢ ĐA NỀN TẢNG (PC & MOBILE) BẰNG POINTER EVENTS API
// Hỗ trợ Tự Động Cuộn Màn Hình (Auto-Scroll) khi giữ kéo thẻ tới mép trên/dưới
// --------------------------------------------------------------------------

let isDragging = false;
let isTouchHandle = false;
let draggedCardEl: HTMLElement | null = null;
let ghostEl: HTMLElement | null = null;
let draggedTaskId: number | null = null;
let startX = 0;
let startY = 0;
let offsetX = 0;
let offsetY = 0;

// Biến quản lý vòng lặp Tự động cuộn trang (Auto-Scroll)
let autoScrollFrameId: number | null = null;
let currentPointerX = 0;
let currentPointerY = 0;

// Bảng ánh xạ ID của container danh sách với Enum trạng thái tương ứng
const statusMap: Record<string, TaskStatus> = {
    "colTodo": TaskStatus.TODO,
    "colDoing": TaskStatus.IN_PROGRESS,
    "colDone": TaskStatus.DONE
};

// 3.1. Sự kiện khi nhấn chuột hoặc chạm ngón tay vào thẻ công việc (pointerdown)
kanbanBoard.addEventListener("pointerdown", (e: PointerEvent) => {
    // Chỉ xử lý nút chuột trái (button = 0) hoặc cảm ứng màn hình
    if (e.button !== undefined && e.button !== 0) return;

    const clickedEl = e.target as HTMLElement;

    // Không kích hoạt kéo nếu bấm trúng nút xóa hoặc dấu tích xanh ở header
    if (clickedEl.classList.contains("btn-delete-task") || clickedEl.classList.contains("status-done")) return;

    const target = clickedEl.closest(".task-card") as HTMLElement;
    if (!target) return;

    isTouchHandle = clickedEl.classList.contains("drag-handle");
    draggedCardEl = target;
    draggedTaskId = Number(target.getAttribute("data-id"));
    startX = e.clientX;
    startY = e.clientY;
    currentPointerX = e.clientX;
    currentPointerY = e.clientY;

    const rect = target.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    // Đăng ký các listener sự kiện di chuyển và nhả chuột/tay trên phạm vi window
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
});

// 3.2. Sự kiện khi rê chuột hoặc di chuyển ngón tay (pointermove)
function onPointerMove(e: PointerEvent) {
    if (!draggedCardEl) return;

    currentPointerX = e.clientX;
    currentPointerY = e.clientY;

    const moveX = Math.abs(e.clientX - startX);
    const moveY = Math.abs(e.clientY - startY);

    // Trên thiết bị di động: Nếu người dùng không chạm vào nút tay cầm drag-handle 
    // và đang vuốt theo chiều dọc (moveY > moveX) -> Hủy kéo để ưu tiên cuộn trang web mượt mà!
    if (e.pointerType === "touch" && !isTouchHandle && !isDragging) {
        if (moveY > 8 && moveY > moveX) {
            cancelPointerTracking();
            return;
        }
    }

    // Chỉ bắt đầu chế độ kéo khi ngón tay/con trỏ đã di chuyển vượt quá 8px
    if (!isDragging && (moveX > 8 || moveY > 8)) {
        isDragging = true;

        // Xóa sạch các lựa chọn bôi đen chữ vô tình do trình duyệt di động tự tạo
        if (window.getSelection) {
            window.getSelection()?.removeAllRanges();
        }

        // Thêm class dragging làm mờ thẻ gốc nằm lại ở cột
        draggedCardEl.classList.add("dragging");

        // Tạo thẻ nổi (Ghost Card) bay theo ngón tay/chuột (Phong cách Angular CDK)
        ghostEl = draggedCardEl.cloneNode(true) as HTMLElement;
        ghostEl.classList.remove("dragging");
        ghostEl.classList.add("ghost-card");

        const rect = draggedCardEl.getBoundingClientRect();
        ghostEl.style.width = `${rect.width}px`;
        ghostEl.style.left = `${e.clientX - offsetX}px`;
        ghostEl.style.top = `${e.clientY - offsetY}px`;

        document.body.appendChild(ghostEl);

        // Kích hoạt vòng lặp kiểm tra Tự động cuộn trang (Auto-Scroll) khi giữ kéo thẻ
        startAutoScrollLoop();
    }

    if (isDragging && ghostEl) {
        // Cập nhật vị trí thẻ nổi bay theo tọa độ con trỏ/ngón tay hiện tại
        ghostEl.style.left = `${e.clientX - offsetX}px`;
        ghostEl.style.top = `${e.clientY - offsetY}px`;

        // Tìm phần tử nằm dưới vị trí ngón tay/chuột hiện tại
        updateHoveredDropTarget(e.clientX, e.clientY);
    }
}

// Cập nhật highlight cột bị rê qua
function updateHoveredDropTarget(clientX: number, clientY: number) {
    const elementBelow = document.elementFromPoint(clientX, clientY);
    document.querySelectorAll(".task-list").forEach(list => list.classList.remove("drag-over"));

    if (elementBelow) {
        const listContainer = elementBelow.closest(".task-list") as HTMLElement;
        if (listContainer) {
            listContainer.classList.add("drag-over");
        }
    }
}

// --------------------------------------------------------------------------
// TỰ ĐỘNG CUỘN TRANG (AUTO-SCROLL) KHI GIỮ KÉO THẺ ĐẾN MÉP MÀN HÌNH
// --------------------------------------------------------------------------
function startAutoScrollLoop() {
    if (!autoScrollFrameId) {
        autoScrollLoop();
    }
}

function autoScrollLoop() {
    if (!isDragging) {
        stopAutoScroll();
        return;
    }

    const threshold = 90; // Khoảng cách 90px từ mép trên/dưới màn hình
    const viewportHeight = window.innerHeight;
    let scrollSpeed = 0;

    if (currentPointerY < threshold) {
        // Rê gần mép trên màn hình -> Cuộn lên trên
        scrollSpeed = -Math.max(6, Math.round((threshold - currentPointerY) / 2.5));
    } else if (currentPointerY > viewportHeight - threshold) {
        // Rê gần mép dưới màn hình -> Cuộn xuống dưới
        scrollSpeed = Math.max(6, Math.round((currentPointerY - (viewportHeight - threshold)) / 2.5));
    }

    if (scrollSpeed !== 0) {
        window.scrollBy(0, scrollSpeed);

        // Đảm bảo thẻ nổi giữ nguyên vị trí theo tọa độ màn hình khi trang cuộn
        if (ghostEl) {
            ghostEl.style.top = `${currentPointerY - offsetY}px`;
        }

        // Cập nhật cột thả vào khi trang đang cuộn
        updateHoveredDropTarget(currentPointerX, currentPointerY);
    }

    autoScrollFrameId = requestAnimationFrame(autoScrollLoop);
}

function stopAutoScroll() {
    if (autoScrollFrameId) {
        cancelAnimationFrame(autoScrollFrameId);
        autoScrollFrameId = null;
    }
}

// 3.3. Sự kiện khi thả chuột hoặc nhấc ngón tay ra (pointerup / pointercancel)
function onPointerUp(e: PointerEvent) {
    if (isDragging && draggedTaskId !== null) {
        const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
        if (elementBelow) {
            const listContainer = elementBelow.closest(".task-list") as HTMLElement;
            if (listContainer) {
                const newStatus = statusMap[listContainer.id];
                if (newStatus) {
                    board.moveTask(draggedTaskId, newStatus);
                    renderBoard(); // Vẽ lại giao diện cột mới và cập nhật bong bóng đếm
                }
            }
        }
    }

    cancelPointerTracking();
}

// Hàm hủy theo dõi pointer và reset giao diện
function cancelPointerTracking() {
    stopAutoScroll();

    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);

    if (ghostEl) {
        ghostEl.remove();
        ghostEl = null;
    }

    if (draggedCardEl) {
        draggedCardEl.classList.remove("dragging");
    }

    document.querySelectorAll(".task-list").forEach(list => list.classList.remove("drag-over"));

    isDragging = false;
    isTouchHandle = false;
    draggedCardEl = null;
    draggedTaskId = null;
}