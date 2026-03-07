#!/bin/bash
set -e

echo "Installing dependencies..."
npm install pg dotenv cors
npm install --save-dev @types/pg @types/cors

echo "Creating directories..."
mkdir -p src/repositories src/routes src/config

echo "Creating db.ts..."
cat << 'INNER_EOF' > src/config/db.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export const pool = new Pool({
    user: process.env.DB_USER || 'salon_admin',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'JHSalonAdmin123',
    port: parseInt(process.env.DB_PORT || '5432'),
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
INNER_EOF

echo "Creating ClientRepository.ts..."
cat << 'INNER_EOF' > src/repositories/ClientRepository.ts
import { query } from '../config/db';

export class ClientRepository {
    static async findAll() {
        const res = await query('SELECT * FROM clients ORDER BY created_at DESC');
        return res.rows;
    }

    static async findById(id: string) {
        const res = await query('SELECT * FROM clients WHERE id = $1', [id]);
        return res.rows[0];
    }

    static async findByPhone(phone: string) {
        const res = await query('SELECT * FROM clients WHERE phone_number = $1', [phone]);
        return res.rows[0];
    }

    static async create(client: { full_name: string; phone_number: string; email?: string }) {
        const res = await query(
            'INSERT INTO clients (full_name, phone_number, email) VALUES ($1, $2, $3) RETURNING *',
            [client.full_name, client.phone_number, client.email]
        );
        return res.rows[0];
    }
}
INNER_EOF

echo "Creating StaffRepository.ts..."
cat << 'INNER_EOF' > src/repositories/StaffRepository.ts
import { query } from '../config/db';

export class StaffRepository {
    static async findAll() {
        const res = await query('SELECT * FROM staff ORDER BY full_name ASC');
        return res.rows;
    }

    static async findById(id: string) {
        const res = await query('SELECT * FROM staff WHERE id = $1', [id]);
        return res.rows[0];
    }
}
INNER_EOF

echo "Creating ServiceRepository.ts..."
cat << 'INNER_EOF' > src/repositories/ServiceRepository.ts
import { query } from '../config/db';

export class ServiceRepository {
    static async findAll() {
        const res = await query('SELECT * FROM services ORDER BY category, name');
        return res.rows;
    }

    static async findById(id: string) {
        const res = await query('SELECT * FROM services WHERE id = $1', [id]);
        return res.rows[0];
    }
}
INNER_EOF

echo "Creating AppointmentRepository.ts..."
cat << 'INNER_EOF' > src/repositories/AppointmentRepository.ts
import { query } from '../config/db';

export class AppointmentRepository {
    static async findAll() {
        const res = await query(`
            SELECT a.*, c.full_name as client_name, s.name as service_name, st.full_name as staff_name
            FROM appointments a
            JOIN clients c ON a.client_id = c.id
            JOIN services s ON a.service_id = s.id
            LEFT JOIN staff st ON a.staff_id = st.id
            ORDER BY a.appointment_time DESC
        `);
        return res.rows;
    }

    static async create(appointment: { client_id: string; service_id: string; staff_id?: string; appointment_time: string; status?: string }) {
        const res = await query(
            'INSERT INTO appointments (client_id, service_id, staff_id, appointment_time, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [appointment.client_id, appointment.service_id, appointment.staff_id, appointment.appointment_time, appointment.status || 'scheduled']
        );
        return res.rows[0];
    }
}
INNER_EOF

echo "Creating clientRoutes.ts..."
cat << 'INNER_EOF' > src/routes/clientRoutes.ts
import { Router } from 'express';
import { ClientRepository } from '../repositories/ClientRepository';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const clients = await ClientRepository.findAll();
        res.json(clients);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
});

router.post('/', async (req, res) => {
    try {
        const client = await ClientRepository.create(req.body);
        res.status(201).json(client);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create client' });
    }
});

export default router;
INNER_EOF

echo "Creating staffRoutes.ts..."
cat << 'INNER_EOF' > src/routes/staffRoutes.ts
import { Router } from 'express';
import { StaffRepository } from '../repositories/StaffRepository';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const staff = await StaffRepository.findAll();
        res.json(staff);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch staff' });
    }
});

export default router;
INNER_EOF

echo "Creating serviceRoutes.ts..."
cat << 'INNER_EOF' > src/routes/serviceRoutes.ts
import { Router } from 'express';
import { ServiceRepository } from '../repositories/ServiceRepository';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const services = await ServiceRepository.findAll();
        res.json(services);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

export default router;
INNER_EOF

echo "Creating appointmentRoutes.ts..."
cat << 'INNER_EOF' > src/routes/appointmentRoutes.ts
import { Router } from 'express';
import { AppointmentRepository } from '../repositories/AppointmentRepository';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const appointments = await AppointmentRepository.findAll();
        res.json(appointments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

router.post('/', async (req, res) => {
    try {
        const appointment = await AppointmentRepository.create(req.body);
        res.status(201).json(appointment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create appointment' });
    }
});

export default router;
INNER_EOF

echo "Updating index.ts..."
cat << 'INNER_EOF' > src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import clientRoutes from './routes/clientRoutes';
import staffRoutes from './routes/staffRoutes';
import serviceRoutes from './routes/serviceRoutes';
import appointmentRoutes from './routes/appointmentRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/clients', clientRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
    console.log(`JH Salon Twin Backend running on port ${port}`);
});
INNER_EOF

echo "Backend Data Layer successfully scaffolded!"
