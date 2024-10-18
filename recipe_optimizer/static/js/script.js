let steps = [];

// Function to add a step
function addStep() {
    const stepNameInput = document.getElementById('stepName');
    const stepDurationInput = document.getElementById('stepDuration');
    const dependency = document.getElementById('dependency').value;

    const content = stepNameInput.value;
    const time = stepDurationInput.value;

    // Get selected prerequisites from checkboxes
    const selectedPrerequisites = [];
    const checkboxes = document.querySelectorAll('#prerequisiteCheckboxes input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        selectedPrerequisites.push(checkbox.value);
    });

    // Check if step name and duration are filled in
    if (content === "" || time === "") {
        alert("Please enter the step name and duration.");
        return;
    }

    // Validate that the step name is not purely numeric
    if (!isNaN(content)) {
        alert("Step name cannot consist solely of numbers!");
        return;
    }

    // Validate the duration
    if (isNaN(time) || time <= 0) {
        alert("Please enter a valid duration.");
        return;
    }

    // Validate chef requirement
    if (dependency !== "true" && dependency !== "false") {
        alert("Please select 'True' or 'False'.");
        return;
    }

    // Create a new step object
    const newStep = {
        content: content,
        time: time,
        occupies_chef: dependency === "true", // Boolean for chef requirement
        prerequisites: selectedPrerequisites
    };

    // Add the new step to the list
    steps.push(newStep);
    updateStepTable(); // Update the table
    updatePrerequisiteCheckboxes(); // Update prerequisites after adding a new step

    // Clear the form
    stepNameInput.value = '';
    stepDurationInput.value = '';
    document.getElementById('dependency').value = 'Select';
}

// Function to save steps as JSON
// function addJson() {
//     const jsonData = JSON.stringify(steps, null, 2); // Format with 2 spaces
    
//     const blob = new Blob([jsonData], { type: 'application/json' });
//     const url = URL.createObjectURL(blob);
    
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'recipe_steps.json'; // File name for download
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a); // Remove the temporary link
//     URL.revokeObjectURL(url); // Release the URL
// }
function addJson() {
    const jsonData = JSON.stringify(steps, null, 2); // Verileri JSON formatına çeviriyoruz
    
    fetch('/api/tasks', { // API URL'sini buraya gir
        method: 'POST', // POST isteği
        headers: {
            'Content-Type': 'application/json', // JSON formatında veri gönderiyoruz
        },
        body: jsonData, // JSON formatındaki veriyi gönderiyoruz
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('API isteği başarısız oldu');
        }
        return response.json(); // JSON cevabını parse et
    })
    .then(data => {
        console.log('Başarılı:', data); // İstek başarılıysa gelen cevabı işleyebilirsin
        alert('Veriler API\'ye başarıyla gönderildi!');
    })
    .catch((error) => {
        console.error('Hata:', error); // Hata varsa burada yakalanır
        alert('API\'ye veri gönderme sırasında bir hata oluştu.');
    });
}
// Function to fetch and display steps from a JSON file
function showStep() {
    fetch('jsonfile.json')
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json(); // Parse JSON data
        })
        .then(data => {
            if (!Array.isArray(data.steps)) {
                throw new Error("The JSON data is not an array:", data);
            }
            const stepsBody = document.getElementById('stepsBody');
            stepsBody.innerHTML = ''; // Clear the table

            data.steps.forEach((step) => {
                const row = document.createElement('tr');

                // Step name
                const nameCell = document.createElement('td');
                nameCell.textContent = step.content;
                row.appendChild(nameCell);

                // Duration
                const timeCell = document.createElement('td');
                timeCell.textContent = step.time;
                row.appendChild(timeCell);

                // Chef requirement
                const chefCell = document.createElement('td');
                chefCell.textContent = step.occupies_chef ? 'True' : 'False';
                row.appendChild(chefCell);

                // Prerequisites
                const prerequisiteCell = document.createElement('td');
                prerequisiteCell.textContent = step.prerequisites.length > 0 ? step.prerequisites.join(', ') : 'None';
                row.appendChild(prerequisiteCell);

                stepsBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error("There was a problem with the fetch operation:", error);
        });
}

// Function to update the table of added steps
function updateStepTable() {
    const stepsBody = document.getElementById('stepsBody');
    stepsBody.innerHTML = ''; // Clear the table

    steps.forEach((step) => {
        const row = document.createElement('tr');

        // Step name
        const nameCell = document.createElement('td');
        nameCell.textContent = step.content;
        row.appendChild(nameCell);

        // Duration
        const timeCell = document.createElement('td');
        timeCell.textContent = step.time;
        row.appendChild(timeCell);

        // Chef requirement
        const chefCell = document.createElement('td');
        chefCell.textContent = step.occupies_chef ? 'True' : 'False';
        row.appendChild(chefCell);

        // Prerequisites
        const prerequisiteCell = document.createElement('td');
        prerequisiteCell.textContent = step.prerequisites.length > 0 ? step.prerequisites.join(', ') : 'None';
        row.appendChild(prerequisiteCell);

        stepsBody.appendChild(row);
    });
}

// Add event listener to input fields
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
            stepDurationInput.value = stepDurationInput.value.substring(1, 4);
        }
    });
}

// Update the prerequisite checkboxes
function updatePrerequisiteCheckboxes() {
    const prerequisiteCheckboxes = document.getElementById('prerequisiteCheckboxes');
    prerequisiteCheckboxes.innerHTML = ''; // Clear the prerequisite area

    steps.forEach(step => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = step.content;
        checkbox.value = step.content;

        const label = document.createElement('label');
        label.htmlFor = step.content;
        label.textContent = step.content;

        const div = document.createElement('div');
        div.appendChild(checkbox);
        div.appendChild(label);

        prerequisiteCheckboxes.appendChild(div);
    });
}

// Update checkboxes and set input listeners when the page loads
document.addEventListener('DOMContentLoaded', function() {
    setupInputListeners(); // Set input listeners
});
