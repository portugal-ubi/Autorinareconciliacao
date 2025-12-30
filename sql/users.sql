-- Insert Admin User
-- Email: m.silva@rglda.pt
-- Password: maurosilva10
-- Role: admin

INSERT INTO user (id, email, password, name, role, createdAt, updatedAt)
VALUES (
    UUID(), 
    'm.silva@rglda.pt', 
    'maurosilva10', 
    'Mauro Silva', 
    'admin', 
    NOW(), 
    NOW()
);
