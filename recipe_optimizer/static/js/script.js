let steps = []; // Global array to hold step data
let editIndex = null; // Index of the step being edited
let messageDiv = document.getElementById("resultMessage");

// Set up input listeners for step name and duration
function setupInputListeners() {
  const stepNameInput = document.getElementById("stepName");
  const stepDurationInput = document.getElementById("stepDuration");

  // Listener for step name
  stepNameInput.addEventListener("input", function () {
    if (stepNameInput.value.length > 120) {
      alert("Step name cannot exceed 120 characters!");
      stepNameInput.value = stepNameInput.value.substring(0, 120);
    }
  });

  // Listener for step duration
  stepDurationInput.addEventListener("input", function () {
    if (stepDurationInput.value.length > 4) {
      alert("Step duration cannot exceed 4 characters!");
      stepDurationInput.value = stepDurationInput.value.substring(0, 4);
    }
  });
}
function formatPrerequisites(prerequisites) {
  if (prerequisites.length === 0) return " "; //
  return prerequisites.map((prerequisite) => `• ${prerequisite}`).join("<br>"); // Use bullet points and break line
}
// Function to format requiresChef value
function formatRequiresChef(requiresChef) {
  return requiresChef ? "✔️" : "❌"; // Checkmark for true, cross for false
}

// Update the prerequisite checkboxes dynamically
function updatePrerequisiteCheckboxes() {
  const prerequisiteCheckboxes = document.getElementById("prerequisiteCheckboxes");
  
  // Tablo yapısı oluştur
  prerequisiteCheckboxes.innerHTML = `
    <label style="font-weight:bold; margin-bottom:10px;">Prerequisites</label>
    <table id="prerequisiteTable" style="width: 100%; border-collapse: collapse;">
      <tbody></tbody>
    </table>
  `;

  const tbody = document.querySelector("#prerequisiteTable tbody");

  steps.forEach((step) => {
    const tr = document.createElement("tr");
    const checkboxTd = document.createElement("td");
    const checkbox = document.createElement("input");
    
    checkbox.type = "checkbox";
    checkbox.value = step.id;
    checkbox.id = "prereq-" + step.id;
    checkboxTd.appendChild(checkbox);

    const labelTd = document.createElement("td");
    const label = document.createElement("label");
    label.htmlFor = "prereq-" + step.id;
    label.textContent = step.content;
    labelTd.appendChild(label);

    tr.appendChild(checkboxTd);
    tr.appendChild(labelTd);
    tbody.appendChild(tr);
  });
}


// Function to remove the specified step
function removeStep(index) {
  const removedStep = steps[index];

  // Check if this step is a prerequisite for other steps
  const isPrerequisiteForOtherSteps = steps.some((step) =>
    step.prerequisites.includes(removedStep.id)
  );

  if (isPrerequisiteForOtherSteps) {
    alert(
      `This step is being used as a prerequisite for another step and cannot be deleted. You must delete those steps first.`
    );
    return; // Stop the deletion
  }

  if (confirm("Are you sure you want to delete this step?")) {
    steps.splice(index, 1); // Remove the step from the steps array
    updateStepTable(); // Update the table
    updatePrerequisiteCheckboxes(); // Update the prerequisite checkboxes
    alert("Step successfully deleted!");
  }
}

// Function to submit data and show results
function submitAndShowResult() {
  messageDiv.style.display = "block";
  const jsonData = JSON.stringify({ tasks: steps }, null, 2); // Convert steps array to JSON
  const apiStepsBody = document.getElementById("apiStepsBody");
  apiStepsBody.innerHTML = "";

  fetch("", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": "{{ csrf_token }}", // CSRF token for security
    },
    body: jsonData, // Send JSON data in request body
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("API request failed: " + response.statusText);
      }
      return response.json(); // Parse JSON response
    })
    .then((data) => {
      const apiStepsBody = document.getElementById("apiStepsBody");
      apiStepsBody.innerHTML = ""; // Clear previous content

      let lastEndTime = null; // Variable to hold the last end time

      data.forEach((step) => {
        const row = document.createElement("tr"); // Create a new row for each step
        row.innerHTML = `
                <td>${step.content}</td>
                <td>${step.time}</td>
                <td>${formatRequiresChef(step.occupies_chef)}</td>
                <td>${formatPrerequisites(step.prerequisites)}</td>
                <td>${step.start_time}</td>
                <td>${step.end_time}</td>
            `;
        apiStepsBody.appendChild(row); // Append the new row to the API steps table

        // Update lastEndTime with the current step's end_time
        lastEndTime = step.end_time;
      });

      alert("API response successfully received and added to the table!");

      messageDiv.innerHTML = `Your optimal cooking time is <strong>${lastEndTime} min`;
    })
    .catch((error) => {
      console.error("Error:", error);
      alert(
        "An error occurred while sending data to the API: " + error.message
      );
    });
}

// Initialize input listeners on document load
document.addEventListener("DOMContentLoaded", setupInputListeners);

// Function to update the step table
function updateStepTable() {
  const tableBody = document.getElementById("stepsBody");
  tableBody.innerHTML = ""; // Clear existing rows

  steps.forEach((step, index) => {
    const row = document.createElement("tr"); // Create a new row
    row.innerHTML = `
            <td>${step.content}</td>
            <td>${step.time}</td>
            <td>${formatRequiresChef(step.occupies_chef)}</td>
            <td>${formatPrerequisites(step.prerequisites)}</td>
            <td>
                <button onclick="editStep(${index})"><i class="fas fa-edit" style="cursor: pointer; font-size='5px'";></i></button>
                <button onclick="removeStep(${index})"><i class="fas fa-trash" style="cursor: pointer;font-size='5px'"></i></button>
            </td>
        `;
    tableBody.appendChild(row);
  });
}

// Function to edit a step
function editStep(index) {
  const step = steps[index]; // Get the step to edit
  editIndex = index; // Set the index for editing

  // Fill form fields with the existing step data
  document.getElementById("stepName").value = step.content;
  document.getElementById("stepDuration").value = step.time;
  document.getElementById("dependency").value = step.occupies_chef
    ? "true"
    : "false";

  // Check prerequisites
  const checkboxes = document.querySelectorAll(
    '#prerequisiteCheckboxes input[type="checkbox"]'
  );
  checkboxes.forEach((checkbox) => {
    checkbox.checked = step.prerequisites.includes(checkbox.value); // Check prerequisites checkboxes
  });

  document.getElementById("submitButton").textContent = "Update"; // Change button text to 'Update'
}

// Function to add or update a step
function addOrUpdateStep() {
  const stepNameInput = document.getElementById("stepName");
  const stepDurationInput = document.getElementById("stepDuration");
  const dependency = document.getElementById("dependency").value;

  const content = stepNameInput.value.trim(); // Get step name
  const time = stepDurationInput.value; // Get step duration

  // Gather prerequisites
  const selectedPrerequisites = [];
  const checkboxes = document.querySelectorAll(
    '#prerequisiteCheckboxes input[type="checkbox"]:checked'
  );
  checkboxes.forEach((checkbox) => {
    selectedPrerequisites.push(checkbox.value); // Collect checked prerequisite values
  });

  // Form validation
  if (content === "" || time === "") {
    alert("Please enter step name and duration.");
    return;
  }

  const stepExists = steps.some(
    (step, index) =>
      step.content.toLowerCase() === content.toLowerCase() &&
      index !== editIndex
  );

  if (stepExists) {
    alert("A step with this name already exists!");
    return; // Stop the addition
  }

  // Step name cannot consist solely of numbers
  if (!isNaN(content)) {
    alert("Step name cannot consist solely of numbers!");
    return;
  }

  // Ensure a valid duration is entered
  if (isNaN(time) || time <= 0) {
    alert("Please enter a valid duration.");
    return;
  }

  // Ensure correct values are selected for chef requirement
  if (dependency !== "true" && dependency !== "false") {
    alert("Please select 'True' or 'False' for chef requirement.");
    return;
  }

  // Create new step object (id slugified)
  const newStep = {
    id: content.replace(/\s+/g, "-").toLowerCase(),
    content: content,
    time: parseInt(time),
    occupies_chef: dependency === "true",
    prerequisites: selectedPrerequisites,
  };

  // Check if the new step is trying to reference itself as a prerequisite
  if (newStep.prerequisites.includes(newStep.id)) {
    alert("A step cannot add itself as a prerequisite!");
    return;
  }

  if (editIndex !== null) {
    // If in edit mode, update the existing step
    steps[editIndex] = newStep;
    editIndex = null;
    document.getElementById("submitButton").textContent = "Add"; // Change button text back to 'Add'
  } else {
    // Add the new step to the steps array
    steps.push(newStep);
  }

  updateStepTable(); // Update the table
  updatePrerequisiteCheckboxes(); // Update the prerequisite checkboxes

  // Clear input fields
  stepNameInput.value = "";
  stepDurationInput.value = "";
  document.getElementById("dependency").value = "Select";
}

document.addEventListener("DOMContentLoaded", setupInputListeners);
