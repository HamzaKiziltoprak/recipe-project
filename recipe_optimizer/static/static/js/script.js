let steps = []; // Global array to hold step data

// Set up input listeners for step name and duration
function setupInputListeners() {
    const stepNameInput = document.getElementById('stepName');
    const stepDurationInput = document.getElementById('stepDuration');

    // Listener for step name
    stepNameInput.addEventListener('input', function() {
        if (stepNameInput.value.length > 120) {
            alert("Step name cannot exceed 120 characters!"); // Alert if the name exceeds 120 characters
            stepNameInput.value = stepNameInput.value.substring(0, 120); // Trim to 120 characters
        }
    });

    // Listener for step duration
    stepDurationInput.addEventListener('input', function() {
        if (stepDurationInput.value.length > 4) {
            alert("Step duration cannot exceed 4 characters!"); // Alert if duration exceeds 4 characters
            stepDurationInput.value = stepDurationInput.value.substring(0, 4); // Trim to 4 characters
        }
    });
}

// Update the prerequisite checkboxes dynamically
function updatePrerequisiteCheckboxes() {
    const prerequisiteCheckboxes = document.getElementById('prerequisiteCheckboxes');
    prerequisiteCheckboxes.innerHTML = ''; // Clear previous checkboxes

    steps.forEach(step => {
        const checkbox = document.createElement('input'); // Create a new checkbox
        checkbox.type = 'checkbox';
        checkbox.value = step.id; // Use step id as value 
        checkbox.id = 'prereq-' + step.id;

        const label = document.createElement('label'); // Create label for the checkbox
        label.htmlFor = 'prereq-' + step.id;
        label.textContent = step.content;

        const div = document.createElement('div'); // Wrap checkbox and label in a div
        div.appendChild(checkbox);
        div.appendChild(label);

        prerequisiteCheckboxes.appendChild(div); // Add checkbox to the page
    });
}

// Function to update the step table with current step data
function updateStepTable() {
    const tableBody = document.getElementById('stepsBody');
    tableBody.innerHTML = ''; // Clear existing rows

    steps.forEach((step, index) => {
        const row = document.createElement('tr'); // Create a new row
        row.innerHTML = `
            <td>${step.content}</td>
            <td>${step.time}</td>
            <td>${step.occupies_chef}</td>
            <td>${step.prerequisites.join(', ')}</td>
            <td><button onclick="removeStep(${index})">Delete</button></td> <!-- Add delete button -->
        `;
        tableBody.appendChild(row); // Append the new row to the table
    });
}

// Function to remove the specified step
function removeStep(index) {
    const removedStep = steps[index]; // Get the step to be removed

    // Check if this step is a prerequisite for other steps
    const isPrerequisiteForOtherSteps = steps.some(step => 
        step.prerequisites.includes(removedStep.id)
    );

    if (isPrerequisiteForOtherSteps) {
        // Show alert if this step is a prerequisite for other steps
        alert(`This step is being used as a prerequisite for another step and cannot be deleted. You must delete those steps first.`);
        return; // Stop the deletion
    }

    // Confirm deletion
    if (confirm("Are you sure you want to delete this step?")) {
        steps.splice(index, 1); // Remove the step from the steps array
        updateStepTable(); // Update the table
        updatePrerequisiteCheckboxes(); // Update the prerequisite checkboxes
        alert("Step successfully deleted!"); // Show success message
    }
}

// Function to submit data and show results
function submitAndShowResult() {
    const jsonData = JSON.stringify({ tasks: steps }, null, 2); // Convert steps array to JSON

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
            throw new Error('API request failed: ' + response.statusText); // Handle API errors
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
                <td>${step.occupies_chef}</td>
                <td>${step.prerequisites.join(', ')}</td>
                <td>${step.start_time}</td>
                <td>${step.end_time}</td>
            `;
            apiStepsBody.appendChild(row); // Append the new row to the API steps table
        });

        alert('API response successfully received and added to the table!'); // Show success message
    })
    .catch((error) => {
        console.error('Error:', error); 
        alert('An error occurred while sending data to the API: ' + error.message); // Handle errors during API submission
    });
}

// Initialize input listeners on document load
document.addEventListener('DOMContentLoaded', setupInputListeners);

let editIndex = null; // Index of the step being edited

// Function to update the step table
function updateStepTable() {
    const tableBody = document.getElementById('stepsBody');
    tableBody.innerHTML = ''; // Clear existing rows

    steps.forEach((step, index) => {
        const row = document.createElement('tr'); // Create a new row
        row.innerHTML = `
            <td>${step.content}</td>
            <td>${step.time}</td>
            <td>${step.occupies_chef}</td>
            <td>${step.prerequisites.join(', ')}</td>
            <td>
                <button onclick="editStep(${index})">Edit</button>
                <button onclick="removeStep(${index})">Delete</button>
            </td> <!-- Add edit and delete buttons -->
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

    const content = stepNameInput.value; // Get step name
    const time = stepDurationInput.value; // Get step duration

    // Gather prerequisites
    const selectedPrerequisites = [];
    const checkboxes = document.querySelectorAll('#prerequisiteCheckboxes input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        selectedPrerequisites.push(checkbox.value); // Collect checked prerequisite values
    });

    // Form validation
    if (content === "" || time === "") {
        alert("Please enter step name and duration."); // Alert if fields are empty
        return;
    }

    // Step name cannot consist solely of numbers
    if (!isNaN(content)) {
        alert("Step name cannot consist solely of numbers!"); // Alert if step name is only numbers
        return;
    }

    // Ensure a valid duration is entered
    if (isNaN(time) || time <= 0) {
        alert("Please enter a valid duration."); // Alert if duration is invalid
        return;
    }

    // Ensure correct values are selected for chef requirement
    if (dependency !== "true" && dependency !== "false") {
        alert("Please select 'True' or 'False'."); // Alert for invalid dependency
        return;
    }

    // Create new step object (id slugified)
    const newStep = {
        id: content.replace(/\s+/g, '-').toLowerCase(), // Replace spaces with '-'
        content: content,
        time: parseInt(time), // Convert duration to integer
        occupies_chef: dependency === "true", // Convert chef requirement to boolean
        prerequisites: selectedPrerequisites
    };

    // Check if the new step is trying to reference itself as a prerequisite
    if (newStep.prerequisites.includes(newStep.id)) {
        alert("A step cannot add itself as a prerequisite!"); // Alert if trying to add itself as a prerequisite
        return; // Stop the addition
    }

    if (editIndex !== null) {
        // If in edit mode, update the existing step
        steps[editIndex] = newStep;
        editIndex = null; // Exit edit mode
        document.getElementById('submitButton').textContent = "Add"; // Change button text back to 'Add'
    } else {
        // Add the new step to the steps array
        steps.push(newStep);
    }

    updateStepTable(); // Update the table
    updatePrerequisiteCheckboxes(); // Update the prerequisite checkboxes

    // Clear the form
    stepNameInput.value = '';
    stepDurationInput.value = '';
    document.getElementById('dependency').value = 'Select';
    checkboxes.forEach(checkbox => checkbox.checked = false); // Uncheck all checkboxes
}
