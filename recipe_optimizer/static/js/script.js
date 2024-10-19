let steps = []; // Global array to hold step data

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

// Update the prerequisite checkboxes
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

        prerequisiteCheckboxes.appendChild(div); // Add checkbox to page
    });
}

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
        id: content.replace(/\s+/g, '-').toLowerCase(), // Slugify with '-' mark
        content: content,
        time: parseInt(time), // Convert time to integer
        occupies_chef: dependency === "true", // Boolean for chef requirement
        prerequisites: selectedPrerequisites
    };

    // Add the new step to the list
    steps.push(newStep);

    // Update the step table
    updateStepTable(); // Add this function to update the table

    // Update prerequisites checkboxes
    updatePrerequisiteCheckboxes(); // Update prerequisites after adding a new step

    // Clear the form
    stepNameInput.value = '';
    stepDurationInput.value = '';
    document.getElementById('dependency').value = 'Select';
}

// Function to update the step table
function updateStepTable() {
    const tableBody = document.getElementById('stepsBody');
    tableBody.innerHTML = ''; // Mevcut satırları temizle

    steps.forEach((step, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${step.content}</td>
            <td>${step.time}</td>
            <td>${step.occupies_chef}</td>
            <td>${step.prerequisites.join(', ')}</td>
            <td><button onclick="removeStep(${index})">Sil</button></td> <!-- Silme butonu ekle -->

        `;
        tableBody.appendChild(row);
    });
}

// Belirtilen indekse göre adımı kaldıran fonksiyon
function removeStep(index) {
    if (confirm("Bu adımı silmek istediğinizden emin misiniz?")) {
        const removedStep = steps[index]; // Silinecek adımı al

        // Diğer adımlardaki prerequisites listesinden bu adımı çıkar
        steps.forEach(step => {
            const stepPrerequisites = step.prerequisites;
            const indexToRemove = stepPrerequisites.indexOf(removedStep.id);
            if (indexToRemove !== -1) {
                stepPrerequisites.splice(indexToRemove, 1); // Ön koşulu sil
            }
        });

        steps.splice(index, 1); // steps dizisinden adımı kaldır
        updateStepTable(); // Tabloyu güncelle
        updatePrerequisiteCheckboxes(); // Ön koşul kutucuklarını güncelle
        alert("Adım ve ön koşulu başarıyla silindi!");
    }
}

function submitAndShowResult() {
    const jsonData = JSON.stringify({ tasks: steps }, null, 2); 

    fetch('', { 
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json', 
            'X-CSRFToken': '{{ csrf_token }}', 
        },
        body: jsonData,
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('API isteği başarısız oldu: ' + response.statusText);
        }
        return response.json(); 
    })
    .then(data => {

        const apiStepsBody = document.getElementById('apiStepsBody');
        apiStepsBody.innerHTML = ''; // reset previous content

        data.forEach(step => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${step.content}</td>
                <td>${step.time}</td>
                <td>${step.occupies_chef}</td>
                <td>${step.prerequisites.join(', ')}</td>
                <td>${step.start_time}</td>
                <td>${step.end_time}</td>
            `;
            apiStepsBody.appendChild(row);
        });

        alert('API yanıtı başarıyla alındı ve tabloya eklendi!');
    })
    .catch((error) => {
        console.error('Hata:', error); 
        alert('API\'ye veri gönderme sırasında bir hata oluştu: ' + error.message);
    });
}
// Initialize input listeners on document load
document.addEventListener('DOMContentLoaded', setupInputListeners);
