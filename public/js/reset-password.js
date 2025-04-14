
/**
    * Toggles the visibility of the password field and updates the eye icon.
    * @param {string} inputId - The ID of the password input field.
    * @param {HTMLElement} icon - The eye icon element.
    */
function togglePasswordVisibility(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash"); // Change to "hide" icon
    } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye"); // Change back to "show" icon
    }
}

const nPasswordIcon = document.getElementById("nPassword-toggle");
nPasswordIcon.addEventListener("click", function () {
    togglePasswordVisibility("new-password", nPasswordIcon);
});

const cPasswordIcon = document.getElementById("cPassword-toggle");
cPasswordIcon.addEventListener("click", function () {
    togglePasswordVisibility("confirm-password", cPasswordIcon);
});


const form = document.getElementById("resetForm");
const errorMessage = document.getElementById("error-message");
const passwordInput = document.getElementById("new-password");
const confirmPasswordInput = document.getElementById("confirm-password");

// Validate passwords match on form submission
form.addEventListener("submit", function (e) {
    if (passwordInput.value.length < 8) {
        e.preventDefault();
        cPasswordIcon.style.top = "50%";
        errorMessage.innerText = "Password must be at least 8 characters";
        errorMessage.style.display = "block";
    } else if (passwordInput.value !== confirmPasswordInput.value) {
        e.preventDefault();
        cPasswordIcon.style.top = "50%";
        errorMessage.innerText = "Passwords do not match";
        errorMessage.style.display = "block";
    } else {
        cPasswordIcon.style.top = "65%";
        errorMessage.innerText = "";
        errorMessage.style.display = "none";
    }
});