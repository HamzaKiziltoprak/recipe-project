let steps = []; // Global array to hold step data
let editIndex = null; // Index of the step being edited

// Set up input listeners for step name and duration
function setupInputListeners() {
    const stepNameInput = document.getElementById('stepName');
    const stepDurationInput = document.getElementById('stepDuration');

    // Listener for step name
    stepNameInput.addEventListener('input', function() {
        if (stepNameInput.value.length > 120) {
            alert("Step name cannot exceed 120 characters!");
            stepNameInput.value = stepNameInput.value.substring(0, 120);
        }
    });

    // Listener for step duration
    stepDurationInput.addEventListener('input', function() {
        if (stepDurationInput.value.length > 4) {
            alert("Step duration cannot exceed 4 characters!");
            stepDurationInput.value = stepDurationInput.value.substring(0, 4);
        }
    });
}

// Function to format requiresChef value
function formatRequiresChef(requiresChef) {
    return requiresChef ? '✔️' : '❌'; // Checkmark for true, cross for false
}

// Update the prerequisite checkboxes dynamically
function updatePrerequisiteCheckboxes() {
    const prerequisiteCheckboxes = document.getElementById('prerequisiteCheckboxes');
    prerequisiteCheckboxes.innerHTML = ''; // Clear previous checkboxes

    steps.forEach(step => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = step.id; // Use step id as value 
        checkbox.id = 'prereq-' + step.id;

        const label = document.createElement('label');
        label.htmlFor = 'prereq-' + step.id;
        label.textContent = step.content;

        const div = document.createElement('div');
        div.appendChild(checkbox);
        div.appendChild(label);

        prerequisiteCheckboxes.appendChild(div); // Add checkbox to the page
    });
}

// Function to remove the specified step
function removeStep(index) {
    const removedStep = steps[index];

    // Check if this step is a prerequisite for other steps
    const isPrerequisiteForOtherSteps = steps.some(step => 
        step.prerequisites.includes(removedStep.id)
    );

    if (isPrerequisiteForOtherSteps) {
        alert(`This step is being used as a prerequisite for another step and cannot be deleted. You must delete those steps first.`);
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
    const jsonData = JSON.stringify({ tasks: steps }, null, 2); // Convert steps array to JSON
    const apiStepsBody = document.getElementById('apiStepsBody');
    apiStepsBody.innerHTML = ''; // Clear previous content

    fetch('', { 
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json', 
            'X-CSRFToken': '{{ csrf_token }}', // CSRF token for security
        },
        body: jsonData, // Send JSON data in request body
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('API request failed: ' + response.statusText);
        }
        return response.json(); // Parse JSON response
    })
    .then(data => {
        const apiStepsBody = document.getElementById('apiStepsBody');
        apiStepsBody.innerHTML = ''; // Clear previous content

        data.forEach(step => {
            const row = document.createElement('tr'); // Create a new row for each step
            row.innerHTML = `
                <td>${step.content}</td>
                <td>${step.time}</td>
                <td>${formatRequiresChef(step.occupies_chef)}</td>
                <td>${step.prerequisites.join(', ')}</td>
                <td>${step.start_time}</td>
                <td>${step.end_time}</td>
            `;
            apiStepsBody.appendChild(row); // Append the new row to the API steps table
        });

        alert('API response successfully received and added to the table!');
    })
    .catch((error) => {
        console.error('Error:', error); 
        alert('An error occurred while sending data to the API: ' + error.message);
    });
}

// Initialize input listeners on document load
document.addEventListener('DOMContentLoaded', setupInputListeners);

// Function to update the step table
function updateStepTable() {
    const tableBody = document.getElementById('stepsBody');
    tableBody.innerHTML = ''; // Clear existing rows

    steps.forEach((step, index) => {
        const row = document.createElement('tr'); // Create a new row
        row.innerHTML = `
            <td>${step.content}</td>
            <td>${step.time}</td>
            <td>${formatRequiresChef(step.occupies_chef)}</td>
            <td>${step.prerequisites.join(', ')}</td>
            <td>
                <button onclick="editStep(${index})"><i class="fas fa-edit" style="cursor: pointer;"></i></button>
                <button onclick="removeStep(${index})"><i class="fas fa-trash" style="cursor: pointer;"></i></button>
            </td>
        `;
        tableBody.appendChild(row); // Append the new row to the table
    });
}

// Function to edit a step
function editStep(index) {
    const step = steps[index]; // Get the step to edit
    editIndex = index; // Set the index for editing

    // Fill form fields with the existing step data
    document.getElementById('stepName').value = step.content;
    document.getElementById('stepDuration').value = step.time;
    document.getElementById('dependency').value = step.occupies_chef ? 'true' : 'false';

    // Check prerequisites
    const checkboxes = document.querySelectorAll('#prerequisiteCheckboxes input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = step.prerequisites.includes(checkbox.value); // Check prerequisites checkboxes
    });

    document.getElementById('submitButton').textContent = "Update"; // Change button text to 'Update'
}

// Function to add or update a step
function addOrUpdateStep() {
    const stepNameInput = document.getElementById('stepName');
    const stepDurationInput = document.getElementById('stepDuration');
    const dependency = document.getElementById('dependency').value;

    const content = stepNameInput.value.trim(); // Get step name
    const time = stepDurationInput.value; // Get step duration

    // Gather prerequisites
    const selectedPrerequisites = [];
    const checkboxes = document.querySelectorAll('#prerequisiteCheckboxes input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        selectedPrerequisites.push(checkbox.value); // Collect checked prerequisite values
    });

    // Form validation
    if (content === "" || time === "") {
        alert("Please enter step name and duration.");
        return;
    }

    const stepExists = steps.some((step, index) => 
        step.content.toLowerCase() === content.toLowerCase() && index !== editIndex
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
        id: content.replace(/\s+/g, '-').toLowerCase(),
        content: content,
        time: parseInt(time),
        occupies_chef: dependency === "true",
        prerequisites: selectedPrerequisites
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
        document.getElementById('submitButton').textContent = "Add"; // Change button text back to 'Add'
    } else {
        // Add the new step to the steps array
        steps.push(newStep);
    }

    updateStepTable(); // Update the table
    updatePrerequisiteCheckboxes(); // Update the prerequisite checkboxes

    // Clear input fields
    stepNameInput.value = '';
    stepDurationInput.value = '';
    document.getElementById('dependency').value = 'Select';
}

// Initialize input listeners on document load
document.addEventListener('DOMContentLoaded', setupInputListeners);
