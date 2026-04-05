import { stringify } from 'csv-stringify/sync';
import { Storage } from '@google-cloud/storage';
import { query } from '../config/db';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import ExcelJS from 'exceljs';
import type { QueryParams } from '../types/repositoryTypes';


const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

export class DataExportService {
  private storage: Storage;
  private bucketName: string;

  constructor() {
    this.storage = new Storage();
    this.bucketName = process.env.EXPORT_BUCKET_NAME || 'salonos-exports';
  }

  async exportClients(format: 'csv' | 'json' | 'excel' = 'csv', salonId?: string): Promise<{ data: string | Buffer; filename: string }> {
    let sqlQuery = `
      SELECT
        id, phone_number, full_name, email, preferences,
        total_visits, last_visit, created_at, salon_id
      FROM clients
    `;

    const params: QueryParams = [];
    if (salonId) {
      sqlQuery += ' WHERE salon_id = $1';
      params.push(salonId);
    }

    sqlQuery += ' ORDER BY created_at DESC';

    const result = await query(sqlQuery, params);
    const clients = result.rows;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `clients_export_${timestamp}.${format === 'excel' ? 'xlsx' : format}`;

    if (format === 'json') {
      const data = JSON.stringify(clients, null, 2);
      return { data, filename };
    } else if (format === 'excel') {
      const columns = [
        'id', 'phone_number', 'full_name', 'email', 'preferences',
        'total_visits', 'last_visit', 'created_at', 'salon_id'
      ];
      const buffer = await this.exportToExcel(clients, columns, 'Clients');
      return { data: buffer, filename };
    } else {
      const columns = [
        'id', 'phone_number', 'full_name', 'email', 'preferences',
        'total_visits', 'last_visit', 'created_at', 'salon_id'
      ];
      const csvData = stringify(clients, { header: true, columns });
      return { data: csvData, filename };
    }
  }async exportAppointments(format: 'csv' | 'json' | 'excel' = 'csv', salonId?: string, startDate?: string, endDate?: string): Promise<{ data: string | Buffer; filename: string }> {
    let sqlQuery = `
      SELECT
        a.id, a.client_id, c.full_name as client_name, c.phone_number as client_phone,
        a.appointment_time, a.status, a.notes, a.created_at, a.salon_id,
        STRING_AGG(s.name, ', ') as services,
        SUM(asv.charged_price) as total_price
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN appointment_services asv ON a.id = asv.appointment_id
      LEFT JOIN services s ON asv.service_id = s.id
    `;

    const conditions: string[] = [];
    const params: QueryParams = [];
    let paramIndex = 1;

    if (salonId) {
      conditions.push(`a.salon_id = $${paramIndex}`);
      params.push(salonId);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`a.appointment_time >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`a.appointment_time <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    if (conditions.length > 0) {
      sqlQuery += ' WHERE ' + conditions.join(' AND ');
    }

    sqlQuery += ' GROUP BY a.id, c.full_name, c.phone_number ORDER BY a.appointment_time DESC';

    const result = await query(sqlQuery, params);
    const appointments = result.rows;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `appointments_export_${timestamp}.${format === 'excel' ? 'xlsx' : format}`;

    if (format === 'json') {
      const data = JSON.stringify(appointments, null, 2);
      return { data, filename };
    } else if (format === 'excel') {
      const columns = [
        'id', 'client_id', 'client_name', 'client_phone',
        'appointment_time', 'status', 'notes', 'created_at', 'salon_id',
        'services', 'total_price'
      ];
      const buffer = await this.exportToExcel(appointments, columns, 'Appointments');
      return { data: buffer, filename };
    } else {
      const columns = [
        'id', 'client_id', 'client_name', 'client_phone',
        'appointment_time', 'status', 'notes', 'created_at', 'salon_id',
        'services', 'total_price'
      ];
      const csvData = stringify(appointments, { header: true, columns });
      return { data: csvData, filename };
    }
  }async exportServices(format: 'csv' | 'json' | 'excel' = 'csv', salonId?: string): Promise<{ data: string | Buffer; filename: string }> {
    let sqlQuery = `
      SELECT
        id, name, description, duration_minutes, price,
        is_active, salon_id
      FROM services
    `;

    const params: QueryParams = [];
    if (salonId) {
      sqlQuery += ' WHERE salon_id = $1';
      params.push(salonId);
    }

    sqlQuery += ' ORDER BY name';

    const result = await query(sqlQuery, params);
    const services = result.rows;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `services_export_${timestamp}.${format === 'excel' ? 'xlsx' : format}`;

    if (format === 'json') {
      const data = JSON.stringify(services, null, 2);
      return { data, filename };
    } else if (format === 'excel') {
      const columns = [
        'id', 'name', 'description', 'duration_minutes', 'price',
        'is_active', 'salon_id'
      ];
      const buffer = await this.exportToExcel(services, columns, 'Services');
      return { data: buffer, filename };
    } else {
      const columns = [
        'id', 'name', 'description', 'duration_minutes', 'price',
        'is_active', 'salon_id'
      ];
      const csvData = stringify(services, { header: true, columns });
      return { data: csvData, filename };
    }
  }
  async exportRevenue(format: 'csv' | 'json' | 'excel' = 'csv', salonId?: string, startDate?: string, endDate?: string): Promise<{ data: string | Buffer; filename: string }> {
    let sqlQuery = `
      SELECT
        DATE_TRUNC('''day''', a.appointment_time) as date,
        COUNT(DISTINCT a.id) as appointment_count,
        COUNT(DISTINCT a.client_id) as unique_clients,
        SUM(asv.charged_price) as total_revenue,
        AVG(asv.charged_price) as average_revenue_per_appointment
      FROM appointments a
      LEFT JOIN appointment_services asv ON a.id = asv.appointment_id
    `;

    const conditions: string[] = [];
    const params: QueryParams = [];
    let paramIndex = 1;

    if (salonId) {
      conditions.push(`a.salon_id = $${paramIndex}`);
      params.push(salonId);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`a.appointment_time >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`a.appointment_time <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    if (conditions.length > 0) {
      sqlQuery += ' WHERE ' + conditions.join(' AND ');
    }

    sqlQuery += ` GROUP BY DATE_TRUNC('day', a.appointment_time) ORDER BY date DESC`;

    const result = await query(sqlQuery, params);
    const revenueData = result.rows;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `revenue_export_${timestamp}.${format === 'excel' ? 'xlsx' : format}`;

    if (format === 'json') {
      const data = JSON.stringify(revenueData, null, 2);
      return { data, filename };
    } else if (format === 'excel') {
      const columns = [
        'date', 'appointment_count', 'unique_clients',
        'total_revenue', 'average_revenue_per_appointment'
      ];
      const buffer = await this.exportToExcel(revenueData, columns, 'Revenue');
      return { data: buffer, filename };
    } else {
      const columns = [
        'date', 'appointment_count', 'unique_clients',
        'total_revenue', 'average_revenue_per_appointment'
      ];
      const csvData = stringify(revenueData, { header: true, columns });
      return { data: csvData, filename };
    }
  }

  async exportStaffPerformance(format: 'csv' | 'json' | 'excel' = 'csv', salonId?: string, startDate?: string, endDate?: string): Promise<{ data: string | Buffer; filename: string }> {
    let sqlQuery = `
      SELECT
        s.id as staff_id,
        s.first_name || ' ' || s.last_name as staff_name,
        COUNT(DISTINCT a.id) as appointments_completed,
        COUNT(DISTINCT a.client_id) as unique_clients,
        SUM(asv.charged_price) as total_revenue_generated,
        AVG(asv.charged_price) as average_revenue_per_appointment,
        AVG(EXTRACT(EPOCH FROM (a.end_time - a.start_time))/60) as average_duration_minutes
      FROM staff s
      LEFT JOIN appointments a ON s.id = a.staff_id
      LEFT JOIN appointment_services asv ON a.id = asv.appointment_id
    `;

    const conditions: string[] = [];
    const params: QueryParams = [];
    let paramIndex = 1;

    if (salonId) {
      conditions.push(`s.salon_id = $${paramIndex}`);
      params.push(salonId);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`a.appointment_time >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`a.appointment_time <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    if (conditions.length > 0) {
      sqlQuery += ' WHERE ' + conditions.join(' AND ');
    }

    sqlQuery += ' GROUP BY s.id, s.first_name, s.last_name ORDER BY total_revenue_generated DESC';

    const result = await query(sqlQuery, params);
    const staffPerformance = result.rows;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `staff_performance_export_${timestamp}.${format === 'excel' ? 'xlsx' : format}`;

    if (format === 'json') {
      const data = JSON.stringify(staffPerformance, null, 2);
      return { data, filename };
    } else if (format === 'excel') {
      const columns = [
        'staff_id', 'staff_name', 'appointments_completed',
        'unique_clients', 'total_revenue_generated',
        'average_revenue_per_appointment', 'average_duration_minutes'
      ];
      const buffer = await this.exportToExcel(staffPerformance, columns, 'Staff Performance');
      return { data: buffer, filename };
    } else {
      const columns = [
        'staff_id', 'staff_name', 'appointments_completed',
        'unique_clients', 'total_revenue_generated',
        'average_revenue_per_appointment', 'average_duration_minutes'
      ];
      const csvData = stringify(staffPerformance, { header: true, columns });
      return { data: csvData, filename };
    }
  }

async uploadToCloudStorage(data: string | Buffer, filename: string, contentType: string): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(`exports/${filename}`);

    await file.save(data, {
      metadata: {
        contentType,
        metadata: {
          exportedAt: new Date().toISOString()
        }
      }
    });

    // Make the file publicly accessible (optional, depending on requirements)
    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${this.bucketName}/exports/${filename}`;
    return publicUrl;
  }

  async exportAndUpload(format: 'csv' | 'json' | 'excel' = 'csv', type: 'clients' | 'appointments' | 'services' | 'revenue' | 'staff-performance', salonId?: string, startDate?: string, endDate?: string): Promise<{ publicUrl: string; filename: string }> {
    let exportResult;

    switch (type) {
      case 'clients':
        exportResult = await this.exportClients(format, salonId);
        break;
      case 'appointments':
        exportResult = await this.exportAppointments(format, salonId, startDate, endDate);
        break;
      case 'services':
        exportResult = await this.exportServices(format, salonId);
        break;
      case 'revenue':
        exportResult = await this.exportRevenue(format, salonId, startDate, endDate);
        break;
      case 'staff-performance':
        exportResult = await this.exportStaffPerformance(format, salonId, startDate, endDate);
        break;
      default:
        throw new Error(`Invalid export type: ${type}`);
    }

    const contentType = format === 'json' ? 'application/json' : format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv';
    const publicUrl = await this.uploadToCloudStorage(exportResult.data, exportResult.filename, contentType);

    return { publicUrl, filename: exportResult.filename };
  }async saveToFile(data: string | Buffer, filename: string, directory: string = '/tmp/exports'): Promise<string> {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    const filePath = path.join(directory, filename);
    await writeFile(filePath, data);
    return filePath;
  }

  async exportToExcel(data: Record<string, unknown>[], columns: string[], sheetName: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Add headers
    worksheet.columns = columns.map(col => ({ header: col, key: col, width: 20 }));

    // Add rows
    worksheet.addRows(data);

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCCCCC' }
    };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

}

export default new DataExportService();
