let currentDate = new Date();
        let selectedDate = null;
        const today = new Date();

        // 초기화
        function init() {
            renderCalendar();
        }

        // 달력 렌더링
        function renderCalendar() {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            // 헤더 업데이트
            document.querySelector('.year-display').textContent = `${year}년`;
            document.querySelector('.month-display').textContent = `${month + 1}월`;

            // 날짜 그리드 생성
            const daysGrid = document.getElementById('daysGrid');
            daysGrid.innerHTML = '';

            // 해당 월의 첫째 날과 마지막 날
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);

            // 첫째 날 이전 빈 칸
            for (let i = 0; i < firstDay.getDay(); i++) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'day empty';
                daysGrid.appendChild(emptyDay);
            }

            // 날짜 채우기
            for (let day = 1; day <= lastDay.getDate(); day++) {
                const dayElement = document.createElement('div');
                dayElement.className = 'day';
                dayElement.textContent = day;

                const date = new Date(year, month, day);
                const dayOfWeek = date.getDay();

                // 일요일/토요일 색상
                if (dayOfWeek === 0) dayElement.classList.add('sunday');
                if (dayOfWeek === 6) dayElement.classList.add('saturday');

                // 오늘 표시
                if (year === today.getFullYear() &&
                    month === today.getMonth() &&
                    day === today.getDate()) {
                    dayElement.classList.add('today');
                }

                // 선택된 날짜 표시
                if (selectedDate &&
                    year === selectedDate.getFullYear() &&
                    month === selectedDate.getMonth() &&
                    day === selectedDate.getDate()) {
                    dayElement.classList.add('selected');
                }

                // 클릭 이벤트
                dayElement.onclick = () => selectDate(year, month, day);

                daysGrid.appendChild(dayElement);
            }
        }

        // 월 변경
        function changeMonth(delta) {
            currentDate.setMonth(currentDate.getMonth() + delta);
            renderCalendar();
        }

        // 연도 변경
        function changeYear(delta) {
            currentDate.setFullYear(currentDate.getFullYear() + delta);
            renderCalendar();
        }

        // 오늘로 이동
        function goToday() {
            currentDate = new Date();
            selectedDate = new Date();
            renderCalendar();
        }

        // 날짜 선택
        function selectDate(year, month, day) {
            selectedDate = new Date(year, month, day);
            renderCalendar();
            
            // 선택된 날짜 알림 (필요시 수정)
            const formatted = `${year}년 ${month + 1}월 ${day}일`;
            console.log('선택된 날짜:', formatted);
        }

        // 연도 모달 열기
        function openYearModal() {
            const modal = document.getElementById('yearModal');
            const yearGrid = document.getElementById('yearGrid');
            modal.classList.add('active');

            // 연도 목록 생성 (현재 연도 기준 ±10년)
            const currentYear = currentDate.getFullYear();
            const thisYear = today.getFullYear();
            yearGrid.innerHTML = '';

            for (let year = thisYear - 10; year <= thisYear + 10; year++) {
                const yearOption = document.createElement('div');
                yearOption.className = 'year-option';
                yearOption.textContent = year;

                if (year === thisYear) {
                    yearOption.classList.add('current');
                }
                if (year === currentYear) {
                    yearOption.classList.add('selected');
                }

                yearOption.onclick = () => {
                    currentDate.setFullYear(year);
                    renderCalendar();
                    closeYearModal();
                };

                yearGrid.appendChild(yearOption);
            }
        }

        // 연도 모달 닫기
        function closeYearModal() {
            document.getElementById('yearModal').classList.remove('active');
        }

        // 모달 외부 클릭 시 닫기
        document.getElementById('yearModal').onclick = function(e) {
            if (e.target === this) {
                closeYearModal();
            }
        };

        // 초기화 실행
        init();