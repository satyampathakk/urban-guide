import sqlite3
from datetime import datetime

def seed_database():
    conn = sqlite3.connect('romantic_app.db')
    cursor = conn.cursor()
    
    # Sample memories
    memories = [
        ("Our First Date", "The day everything changed 💕", "/images/first-date.jpg"),
        ("Beach Sunset", "Walking hand in hand as the sun set", "/images/beach-sunset.jpg"),
        ("Anniversary Dinner", "One year of pure happiness", "/images/anniversary.jpg"),
        ("Weekend Getaway", "Just us and the mountains", "/images/mountains.jpg"),
    ]
    
    for title, caption, image_url in memories:
        cursor.execute(
            "INSERT OR IGNORE INTO memories (title, caption, image_url) VALUES (?, ?, ?)",
            (title, caption, image_url)
        )
    
    # Sample poems
    poems = [
        ("Forever Yours", """In your eyes I see tomorrow,
In your smile I find my home,
Every heartbeat whispers softly,
You're the one I'll never roam.

Through the seasons we will wander,
Hand in hand through joy and tears,
Building dreams and sharing laughter,
Growing stronger through the years."""),
        
        ("Morning Light", """When morning light touches your face,
I'm reminded of love's sweet grace,
Every dawn brings something new,
But my heart belongs to you.

Coffee shared in quiet moments,
Gentle kisses, soft and true,
Life's most beautiful components
Are the ones I share with you."""),
        
        ("Our Song", """We dance to melodies unheard,
Move to rhythms of the heart,
Every step and every word
Shows we'll never be apart.

Music plays in whispered secrets,
Harmonies in how we laugh,
Love's the song that never ceases,
You're my better, sweeter half.""")
    ]
    
    for title, content in poems:
        cursor.execute(
            "INSERT OR IGNORE INTO poems (title, content) VALUES (?, ?)",
            (title, content)
        )
    
    conn.commit()
    conn.close()
    print("Database seeded with sample data!")

if __name__ == "__main__":
    seed_database()