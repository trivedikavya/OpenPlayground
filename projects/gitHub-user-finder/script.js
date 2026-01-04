const body = document.querySelector('body')
const toggleSwitch = document.querySelector('#toggle-btn');
const input = document.querySelector('input');
const searchBtn = document.querySelector('.search-btn');
const reveal = document.querySelector('.hidden');

let currMode = "Dark";
toggleSwitch.addEventListener("click", (evt) => {
    if (currMode === "Light") {
    currMode = "Dark";
    body.classList.add("dark-mode");
    body.classList.remove("light-mode");
    toggleSwitch.classList.add("fa-toggle-on");
    toggleSwitch.classList.remove("fa-toggle-off");
    toggleSwitch.style.color = "#ffffff";
  } else {
    currMode = "Light";
    body.classList.add("light-mode");
    body.classList.remove("dark-mode");
    toggleSwitch.classList.add("fa-toggle-off");
    toggleSwitch.classList.remove("fa-toggle-on");
    toggleSwitch.style.color = "#000000";
  }
});

// input.addEventListener()

searchBtn.addEventListener("click", () => {
    if (input.value === "") {
        alert("Please enter a GitHub username.");
        return;
    }
    else if (input.value !== "") {
        reveal.classList.add("hidden");
    }
    else {
        reveal.classList.remove("hidden");
    }
});