-- Generate Sample Data Script
-- This script creates sample clients, projects, and invoices for testing analytics

-- First, let's get a user ID to use as created_by
-- We'll use the first profile in the database
DO $$
DECLARE
    sample_user_id UUID;
    client_ids UUID[];
    project_ids UUID[];
    i INTEGER;
BEGIN
    -- Get the first user ID from profiles table
    SELECT id INTO sample_user_id FROM profiles LIMIT 1;
    
    IF sample_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found in profiles table. Please create a user first.';
    END IF;
    
    RAISE NOTICE 'Using user ID: %', sample_user_id;
    
    -- Generate 10 sample clients
    FOR i IN 1..10 LOOP
        INSERT INTO clients (
            name, 
            email, 
            phone, 
            company, 
            status, 
            created_by,
            created_at,
            updated_at
        ) VALUES (
            CASE i
                WHEN 1 THEN 'John Smith'
                WHEN 2 THEN 'Sarah Johnson'
                WHEN 3 THEN 'Michael Brown'
                WHEN 4 THEN 'Emily Davis'
                WHEN 5 THEN 'David Wilson'
                WHEN 6 THEN 'Lisa Anderson'
                WHEN 7 THEN 'Robert Taylor'
                WHEN 8 THEN 'Jennifer Martinez'
                WHEN 9 THEN 'William Garcia'
                WHEN 10 THEN 'Amanda Rodriguez'
            END,
            CASE i
                WHEN 1 THEN 'john.smith@email.com'
                WHEN 2 THEN 'sarah.johnson@company.com'
                WHEN 3 THEN 'michael.brown@business.com'
                WHEN 4 THEN 'emily.davis@startup.com'
                WHEN 5 THEN 'david.wilson@corp.com'
                WHEN 6 THEN 'lisa.anderson@agency.com'
                WHEN 7 THEN 'robert.taylor@enterprise.com'
                WHEN 8 THEN 'jennifer.martinez@tech.com'
                WHEN 9 THEN 'william.garcia@solutions.com'
                WHEN 10 THEN 'amanda.rodriguez@consulting.com'
            END,
            CASE i
                WHEN 1 THEN '+1-555-0101'
                WHEN 2 THEN '+1-555-0102'
                WHEN 3 THEN '+1-555-0103'
                WHEN 4 THEN '+1-555-0104'
                WHEN 5 THEN '+1-555-0105'
                WHEN 6 THEN '+1-555-0106'
                WHEN 7 THEN '+1-555-0107'
                WHEN 8 THEN '+1-555-0108'
                WHEN 9 THEN '+1-555-0109'
                WHEN 10 THEN '+1-555-0110'
            END,
            CASE i
                WHEN 1 THEN 'Smith Consulting'
                WHEN 2 THEN 'Johnson & Associates'
                WHEN 3 THEN 'Brown Industries'
                WHEN 4 THEN 'Davis Startup Inc'
                WHEN 5 THEN 'Wilson Corporation'
                WHEN 6 THEN 'Anderson Creative Agency'
                WHEN 7 THEN 'Taylor Enterprises'
                WHEN 8 THEN 'Martinez Tech Solutions'
                WHEN 9 THEN 'Garcia Business Solutions'
                WHEN 10 THEN 'Rodriguez Consulting Group'
            END,
            CASE 
                WHEN i <= 7 THEN 'active'::client_status
                WHEN i <= 9 THEN 'pending'::client_status
                ELSE 'inactive'::client_status
            END,
            sample_user_id,
            NOW() - INTERVAL '1 day' * (i * 10), -- Spread creation dates over time
            NOW() - INTERVAL '1 day' * (i * 5)   -- Spread update dates over time
        );
    END LOOP;
    
    -- Get all client IDs for creating projects
    SELECT ARRAY(SELECT id FROM clients ORDER BY created_at DESC LIMIT 10) INTO client_ids;
    
    -- Generate sample projects for some clients
    FOR i IN 1..8 LOOP
        INSERT INTO projects (
            name,
            description,
            status,
            priority,
            start_date,
            end_date,
            budget,
            client_id,
            created_by,
            created_at,
            updated_at
        ) VALUES (
            CASE i
                WHEN 1 THEN 'Website Redesign'
                WHEN 2 THEN 'Mobile App Development'
                WHEN 3 THEN 'Brand Identity Package'
                WHEN 4 THEN 'E-commerce Platform'
                WHEN 5 THEN 'Marketing Campaign'
                WHEN 6 THEN 'Database Migration'
                WHEN 7 THEN 'API Integration'
                WHEN 8 THEN 'Security Audit'
            END,
            CASE i
                WHEN 1 THEN 'Complete website redesign with modern UI/UX'
                WHEN 2 THEN 'Native mobile application for iOS and Android'
                WHEN 3 THEN 'Full brand identity including logo and guidelines'
                WHEN 4 THEN 'Custom e-commerce solution with payment integration'
                WHEN 5 THEN 'Digital marketing campaign across multiple channels'
                WHEN 6 THEN 'Migration from legacy database to modern solution'
                WHEN 7 THEN 'Third-party API integration and documentation'
                WHEN 8 THEN 'Comprehensive security assessment and recommendations'
            END,
            CASE 
                WHEN i <= 3 THEN 'active'::project_status
                WHEN i <= 5 THEN 'planning'::project_status
                WHEN i <= 7 THEN 'completed'::project_status
                ELSE 'cancelled'::project_status
            END,
            CASE 
                WHEN i <= 2 THEN 'high'::priority_level
                WHEN i <= 5 THEN 'medium'::priority_level
                ELSE 'low'::priority_level
            END,
            CURRENT_DATE - INTERVAL '1 month' * i,
            CURRENT_DATE + INTERVAL '1 month' * (6 - i),
            CASE i
                WHEN 1 THEN 15000.00
                WHEN 2 THEN 25000.00
                WHEN 3 THEN 8000.00
                WHEN 4 THEN 35000.00
                WHEN 5 THEN 12000.00
                WHEN 6 THEN 18000.00
                WHEN 7 THEN 22000.00
                WHEN 8 THEN 9000.00
            END,
            client_ids[i],
            sample_user_id,
            NOW() - INTERVAL '1 day' * (i * 8),
            NOW() - INTERVAL '1 day' * (i * 4)
        );
    END LOOP;
    
    -- Get project IDs for creating invoices
    SELECT ARRAY(SELECT id FROM projects ORDER BY created_at DESC LIMIT 8) INTO project_ids;
    
    -- Generate sample invoices
    FOR i IN 1..12 LOOP
        INSERT INTO invoices (
            invoice_number,
            amount,
            status,
            due_date,
            client_id,
            project_id,
            created_by,
            created_at,
            updated_at
        ) VALUES (
            'INV-' || LPAD(i::TEXT, 4, '0'),
            CASE i
                WHEN 1 THEN 5000.00
                WHEN 2 THEN 8500.00
                WHEN 3 THEN 3200.00
                WHEN 4 THEN 12000.00
                WHEN 5 THEN 4500.00
                WHEN 6 THEN 7800.00
                WHEN 7 THEN 9200.00
                WHEN 8 THEN 3800.00
                WHEN 9 THEN 6500.00
                WHEN 10 THEN 4200.00
                WHEN 11 THEN 8900.00
                WHEN 12 THEN 5600.00
            END,
            CASE 
                WHEN i <= 6 THEN 'paid'::invoice_status
                WHEN i <= 9 THEN 'sent'::invoice_status
                WHEN i <= 11 THEN 'overdue'::invoice_status
                ELSE 'draft'::invoice_status
            END,
            CURRENT_DATE + INTERVAL '1 month' - INTERVAL '1 week' * i,
            client_ids[((i - 1) % 10) + 1], -- Cycle through clients
            CASE WHEN i <= 8 THEN project_ids[i] ELSE NULL END, -- Some invoices without projects
            sample_user_id,
            NOW() - INTERVAL '1 day' * (i * 6),
            NOW() - INTERVAL '1 day' * (i * 3)
        );
    END LOOP;
    
    RAISE NOTICE 'Sample data generation completed successfully!';
    RAISE NOTICE 'Generated: 10 clients, 8 projects, 12 invoices';
    
END $$;

-- Display summary of generated data
SELECT 
    'Clients' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_count
FROM clients
UNION ALL
SELECT 
    'Projects' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
    COUNT(CASE WHEN status = 'planning' THEN 1 END) as planning_count,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
FROM projects
UNION ALL
SELECT 
    'Invoices' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
    COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
    COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count
FROM invoices;