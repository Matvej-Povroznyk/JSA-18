import { ServiceApi } from "serviceapi";
import * as basicLightBox from "basiclightbox";
import "basiclightbox/dist/basicLightbox.min.css";

const api = new ServiceApi("http://localhost:3000");
let nextId = null;

const refs = {
  buttons: {
    getStudents: document.querySelector("#get-students-btn"),
    addStudent: document.querySelector("#add-student"),
  },
  addStudentForm: document.querySelector("#add-student-form"),
  studentsTableBody: document.querySelector("#students-table tbody"),
  inputs: {
    name: document.querySelector("#name"),
    age: document.querySelector("#age"),
    course: document.querySelector("#course"),
    skills: document.querySelector("#skills"),
    email: document.querySelector("#email"),
    isEnrolled: document.querySelector("#isEnrolled"),
  },
};

let currentEditingId = null;
let currentStudentData = null;

const editModal = basicLightBox.create(
  `
    <div class="modal">
        <button type="button" class="close-modal-btn">&times;</button>
        <h2>Редагувати студента</h2>
        <form id="edit-student-form">
            <label>ID: <input type="text" name="ID" disabled/></label>
            <label>Ім'я: <input type="text" name="name" required /></label>
            <label>Вік: <input type="number" name="age" required /></label>
            <label>Курс: <input type="text" name="course" required /></label>
            <label>Навички (через кому): <input type="text" name="skills" required/></label>
            <label>Email: <input type="email" name="email" required /></label>
            <label>Записаний: <input type="checkbox" name="isEnrolled" /></label>
            <button type="submit">Зберегти</button>
      </form>
    </div>
`,
  {
    closable: false,
    onShow: (instance) => {
      const form = instance.element().querySelector(`#edit-student-form`);
      const closeBtn = instance.element().querySelector(`.close-modal-btn`);

      closeBtn.onclick = () => {
        instance.close();
        currentEditingId = null;
        currentStudentData = null;
      };

      if (currentStudentData) {
        form.ID.value = currentStudentData.id;
        form.name.value = currentStudentData.name;
        form.age.value = currentStudentData.age;
        form.course.value = currentStudentData.course;
        form.skills.value = currentStudentData.skills.join(`, `);
        form.email.value = currentStudentData.email;
        form.isEnrolled.checked = currentStudentData.isEnrolled;
      }

      form.onsubmit = (e) => {
        e.preventDefault();

        const updatedData = {
          name: form.name.value.trim(),
          age: Number(form.age.value),
          course: form.course.value.trim(),
          skills: form.skills.value.split(/,\s*|\s*,\s*/).filter(Boolean),
          email: form.email.value.trim(),
          isEnrolled: form.isEnrolled.checked,
        };

        updateStudent(currentEditingId, updatedData);
      };
    },
  },
);

function getStudents() {
  return api
    .getAll("/students")
    .then((students) => {
      if (!Array.isArray(students)) return [];
      return students;
    })
    .catch((err) => {
      console.error(err);
      return [];
    });
}

function renderStudents(students) {
  if (!students) return;

  const markup = students
    .map((student) => {
      const skillsMarkup =
        student.skills && student.skills.length > 0
          ? student.skills.join(", ")
          : "Відсутні";

      return `
        <tr>
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.age}</td>
            <td>${student.course}</td>
            <td>${skillsMarkup}</td>
            <td>${student.email}</td>
            <td>${student.isEnrolled ? "Так" : "Ні"}</td>
            <td>
                <button class="delete-btn" style="margin-bottom: 5px;" data-id="${student.id}">
                    <svg width="16px" height="16px" viewBox="0 0 16 16" fill="white" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8ZM10.3128 12.4341C9.62116 12.7956 8.83445 13 8 13C5.23858 13 3 10.7614 3 8C3 7.16555 3.20441 6.37884 3.5659 5.68722L10.3128 12.4341ZM12.4341 10.3128L5.68722 3.5659C6.37884 3.20441 7.16555 3 8 3C10.7614 3 13 5.23858 13 8C13 8.83445 12.7956 9.62116 12.4341 10.3128Z" fill="currentColor"/>
                    </svg>
                </button>
                <button class="update-btn" data-id="${student.id}">
                    <svg width="16px" height="16px" viewBox="0 0 16 16" fill="white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 0L16 3L9 10H6V7L13 0Z" fill="currentColor"/>
                        <path d="M1 1V15H15V9H13V13H3V3H7V1H1Z" fill="currentColor"/>
                    </svg>
                </button>
            </td>
        </tr>
      `;
    })
    .join("");

  refs.studentsTableBody.innerHTML = markup;
}

function addStudent(e) {
  e.preventDefault();

  getStudents()
    .then((students) => {
      if (students.length > 0) {
        const ids = students
          .map((student) => Number(student.id))
          .filter((id) => !isNaN(id));
        if (ids.length > 0) {
          nextId = Math.max(...ids) + 1;
        }
      }

      const newStudent = {
        id: String(nextId),
        name: refs.inputs.name.value.trim(),
        age: Number(refs.inputs.age.value),
        course: refs.inputs.course.value.trim(),
        skills: refs.inputs.skills.value.split(/,\s*|\s*,\s*/).filter(Boolean),
        email: refs.inputs.email.value.trim(),
        isEnrolled: refs.inputs.isEnrolled.checked,
      };

      return api.create(`/students`, newStudent);
    })
    .then(() => {
      refs.addStudentForm.reset();
      return getStudents();
    })
    .then((students) => {
      renderStudents(students);
    })
    .catch((error) => console.error(error));
}

function updateStudent(id, data) {
  api
    .update(`/students`, id, data, `PUT`)
    .then(() => {
      editModal.close();
      currentEditingId = null;
      currentStudentData = null;
      return getStudents();
    })
    .then((students) => {
      renderStudents(students);
    })
    .catch((err) => console.error(err));
}

function deleteStudent(id) {
  api
    .delete(`/students`, id)
    .then(() => getStudents())
    .then((students) => {
      renderStudents(students);
    })
    .catch((error) => {
      console.error(error);
    });
}

function handleRender() {
  getStudents().then((students) => renderStudents(students));
}

function handleDelete(e) {
  const deleteBtn = e.target.closest(`.delete-btn`);
  if (!deleteBtn) return;

  const studentId = deleteBtn.dataset.id;
  const isConfirmed = confirm(`Ви впевнені, що хочете видалити студента?`);
  if (!isConfirmed) return;

  deleteStudent(studentId);
}

function handleEdit(e) {
  const editBtn = e.target.closest(`.update-btn`);
  if (!editBtn) return;

  currentEditingId = editBtn.dataset.id;
  api
    .getById(`/students`, currentEditingId)
    .then((student) => {
      currentStudentData = student;
      editModal.show();
    })
    .catch((err) => console.error(err));
}

refs.buttons.getStudents.addEventListener("click", handleRender);
refs.addStudentForm.addEventListener(`submit`, addStudent);
refs.studentsTableBody.addEventListener(`click`, handleDelete);
refs.studentsTableBody.addEventListener(`click`, handleEdit);
