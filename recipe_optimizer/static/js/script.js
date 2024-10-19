let steps = []; 
        
        function updatePrerequisites() {
            const prerequisiteCheckboxes = document.getElementById('prerequisiteCheckboxes');
            prerequisiteCheckboxes.innerHTML = ''; // clear previous checkbox

            steps.forEach(step => {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = step.id; // use steps id as a value 
                checkbox.id = 'prereq-' + step.id;

                const label = document.createElement('label');
                label.htmlFor = 'prereq-' + step.id;
                label.textContent = step.content;

                const div = document.createElement('div');
                div.appendChild(checkbox);
                div.appendChild(label);

                prerequisiteCheckboxes.appendChild(div); // add checkbox to page
            });
        }
        function addStep() {
            const stepName = document.getElementById('stepName').value;
            const stepDuration = parseInt(document.getElementById('stepDuration').value);
            const requiresChef = document.getElementById('dependency').value === 'true';
            const prerequisites = []; // track prereqisites

            // collect prerequisites from selected in checkbox
            const checkboxes = document.querySelectorAll('#prerequisiteCheckboxes input[type="checkbox"]:checked');
            checkboxes.forEach(checkbox => prerequisites.push(checkbox.value));

            // Adımı steps array'ine ekliyoruz
            const newStep = {
                id: stepName.replace(/\s+/g, '-').toLowerCase(), // slugify with '-' mark
                content: stepName,
                time: stepDuration,
                prerequisites: prerequisites,
                occupies_chef: requiresChef,
            };
            steps.push(newStep);

            // add steps section
            const tableBody = document.getElementById('stepsBody');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${stepName}</td>
                <td>${stepDuration}</td>
                <td>${requiresChef}</td>
                <td>${prerequisites.join(', ')}</td>
            `;
            tableBody.appendChild(row);

            // update checkbox
            updatePrerequisites();

            // reset form
            document.getElementById('stepName').value = '';
            document.getElementById('stepDuration').value = '';
            document.getElementById('dependency').value = 'Select';
            document.querySelectorAll('#prerequisiteCheckboxes input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
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