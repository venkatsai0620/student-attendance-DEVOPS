from flask import Flask, render_template, request, jsonify, session, redirect
from datetime import datetime
import json
import os
from collections import defaultdict

app = Flask(__name__)
app.secret_key = 'your-secret-key-here-change-in-production'

# File to store attendance records
ATTENDANCE_FILE = 'attendance_records.json'
STUDENTS_FILE = 'students.json'

# Initialize student data
def get_students():
    """Load students from students.json"""
    if os.path.exists(STUDENTS_FILE):
        with open(STUDENTS_FILE, "r") as f:
            return json.load(f)
    return []
def save_students(students):
    """Save students to students.json"""
    with open(STUDENTS_FILE, "w") as f:
        json.dump(students, f, indent=4)

def load_attendance():
    """Load attendance records from JSON file"""
    if os.path.exists(ATTENDANCE_FILE):
        try:
            with open(ATTENDANCE_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_attendance(attendance_data):
    """Save attendance records to JSON file"""
    with open(ATTENDANCE_FILE, 'w') as f:
        json.dump(attendance_data, f, indent=2)

@app.route('/')
def index():
    students = get_students()
    today = datetime.now().strftime('%Y-%m-%d')
    current_time = datetime.now().strftime('%I:%M:%S %p')

    records = load_attendance()

    total_students = len(students)

    total_days = len(records)

    today_present = 0

    if today in records:
        today_present = sum(
            1
            for s in records[today].values()
            if s["status"] == "present"
        )

    return render_template(
        "index.html",
        students=students,
        today=today,
        current_time=current_time,
        total_students=total_students,
        total_days=total_days,
        today_present=today_present
    )

@app.route('/manage_students')
def manage_students():
    students = get_students()
    return render_template('manage_students.html', students=students)
@app.route('/add_student', methods=['POST'])
def add_student():
    students = get_students()

    new_student = {
        "id": request.form['id'],
        "name": request.form['name'],
        "class": request.form['class']
    }

    # Prevent duplicate Student IDs
    for student in students:
        if student['id'] == new_student['id']:
            return "Student ID already exists!"

    students.append(new_student)
    save_students(students)

    return redirect('/manage_students')

@app.route('/delete_student/<student_id>')
def delete_student(student_id):

    students = get_students()

    students = [
        student for student in students
        if student['id'] != student_id
    ]

    save_students(students)

    return redirect('/manage_students')

@app.route('/mark_attendance', methods=['POST'])
def mark_attendance():
    """Handle attendance submission"""
    try:
        # Get form data
        attendance_data = request.form.to_dict()
        date = attendance_data.get('date', datetime.now().strftime('%Y-%m-%d'))
        
        # Process attendance
        present_students = []
        absent_students = []
        attendance_time = datetime.now().strftime('%I:%M:%S %p')
        
        # Load existing records
        all_records = load_attendance()
        
        # Initialize today's record if not exists
        if date not in all_records:
            all_records[date] = {}
        
        # Process each student's attendance
        for key, value in attendance_data.items():
            if key.startswith('attendance_'):
                student_id = key.replace('attendance_', '')
                status = value  # 'present' or 'absent'
                
                # Find student name
                student_name = None
                for student in get_students():
                    if student['id'] == student_id:
                        student_name = student['name']
                        break
                
                # Store attendance with timestamp
                all_records[date][student_id] = {
                    'status': status,
                    'time': attendance_time,
                    'name': student_name
                }
                
                if status == 'present':
                    present_students.append(student_name or student_id)
                else:
                    absent_students.append(student_name or student_id)
        
        # Save to file
        save_attendance(all_records)
        
        # Calculate statistics
        total_students = len(get_students())
        present_count = len(present_students)
        absent_count = total_students - present_count
        attendance_percentage = round((present_count / total_students) * 100, 2) if total_students > 0 else 0
        
        return render_template('summary.html',
                             date=date,
                             present_students=present_students,
                             absent_students=absent_students,
                             present_count=present_count,
                             absent_count=absent_count,
                             total_students=total_students,
                             attendance_percentage=attendance_percentage,
                             attendance_time=attendance_time)
                             
    except Exception as e:
        return f"Error marking attendance: {str(e)}", 400

@app.route('/view_records')
def view_records():
    """View all attendance records"""
    records = load_attendance()
    students = get_students()

    # Student Statistics
    student_stats = {}

    for student in students:
        student_stats[student['id']] = {
            'name': student['name'],
            'present': 0,
            'absent': 0,
            'percentage': 0
        }

    # Calculate statistics
    for day in records.values():
        for sid, details in day.items():
            if sid in student_stats:
                if details.get('status') == 'present':
                    student_stats[sid]['present'] += 1
                else:
                    student_stats[sid]['absent'] += 1

    for sid in student_stats:
        total = (
            student_stats[sid]['present'] +
            student_stats[sid]['absent']
        )

        if total > 0:
            student_stats[sid]['percentage'] = round(
                student_stats[sid]['present'] * 100 / total,
                2
            )

    # Sort dates in descending order
    sorted_dates = sorted(records.keys(), reverse=True)

    # Prepare data for display
    record_data = []

    for date in sorted_dates[:10]:
        day_record = records[date]

        present = sum(
            1 for s in day_record.values()
            if s.get('status') == 'present'
        )

        absent = len(day_record) - present

        record_data.append({
            'date': date,
            'present': present,
            'absent': absent,
            'total': len(day_record),
            'details': day_record
        })

    return render_template(
        "records.html",
        records=record_data,
        students=students,
        student_stats=student_stats
    )

@app.route('/search_records', methods=['GET'])
def search_records():
    search = request.args.get('search', '').strip().lower()

    records = load_attendance()
    students = get_students()

    # Student Statistics
    student_stats = {}

    for student in students:
        student_stats[student['id']] = {
            'name': student['name'],
            'present': 0,
            'absent': 0,
            'percentage': 0
        }

    for day in records.values():
        for sid, details in day.items():
            if sid in student_stats:
                if details.get('status') == 'present':
                    student_stats[sid]['present'] += 1
                else:
                    student_stats[sid]['absent'] += 1

    for sid in student_stats:
        total = student_stats[sid]['present'] + student_stats[sid]['absent']
        if total > 0:
            student_stats[sid]['percentage'] = round(
                student_stats[sid]['present'] * 100 / total,
                2
            )

    filtered_records = []

    for date, day_record in records.items():
        matched = {}

        for student_id, details in day_record.items():
            student_name = details.get("name", "").lower()

            if (
                search in student_id.lower()
                or search in student_name
                or search in date.lower()
            ):
                matched[student_id] = details

        if matched:
            present = sum(
                1 for s in matched.values()
                if s.get("status") == "present"
            )

            absent = len(matched) - present

            filtered_records.append({
                "date": date,
                "present": present,
                "absent": absent,
                "total": len(matched),
                "details": matched
            })

    filtered_records.sort(key=lambda x: x["date"], reverse=True)

    return render_template(
        "records.html",
        records=filtered_records,
        students=students,
        student_stats=student_stats,
        search=search
    )
@app.route('/api/attendance_stats')
def attendance_stats():
    """API endpoint for attendance statistics"""
    records = load_attendance()
    students = get_students()
    
    # Calculate per-student statistics
    student_stats = {}
    for student in students:
        student_id = student['id']
        student_stats[student_id] = {
            'name': student['name'],
            'total_days': 0,
            'present_days': 0,
            'absent_days': 0
        }
    
    for date, day_record in records.items():
        for student_id, data in day_record.items():
            if student_id in student_stats:
                student_stats[student_id]['total_days'] += 1
                if data.get('status') == 'present':
                    student_stats[student_id]['present_days'] += 1
                else:
                    student_stats[student_id]['absent_days'] += 1
    
    return jsonify(student_stats)

@app.route('/clear_attendance', methods=['POST'])
def clear_attendance():
    """Clear all attendance records (for testing)"""
    if os.path.exists(ATTENDANCE_FILE):
        os.remove(ATTENDANCE_FILE)
    return "All attendance records cleared successfully!"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)