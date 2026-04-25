import sqlite3

def migrate():
    conn = sqlite3.connect('woundmonitor.db')
    cursor = conn.cursor()
    
    # Check if column exists
    cursor.execute('PRAGMA table_info(doctor_notes)')
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'sender_role' not in columns:
        print("Adding sender_role column...")
        cursor.execute('ALTER TABLE doctor_notes ADD COLUMN sender_role VARCHAR DEFAULT "doctor"')
        conn.commit()
        print("Column added successfully.")
    else:
        print("Column sender_role already exists.")
        
    conn.close()

if __name__ == "__main__":
    migrate()
