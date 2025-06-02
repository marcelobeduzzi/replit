-- Tabla para almacenar los registros de fichaje por QR
CREATE TABLE IF NOT EXISTS qr_clock_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  location_id TEXT NOT NULL,
  location_name TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  clock_type TEXT NOT NULL CHECK (clock_type IN ('entrada', 'salida')),
  latitude NUMERIC,
  longitude NUMERIC,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_qr_clock_employee_id ON qr_clock_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_qr_clock_location_id ON qr_clock_records(location_id);
CREATE INDEX IF NOT EXISTS idx_qr_clock_timestamp ON qr_clock_records(timestamp);
CREATE INDEX IF NOT EXISTS idx_qr_clock_type ON qr_clock_records(clock_type);

-- Comentarios para documentar la tabla
COMMENT ON TABLE qr_clock_records IS 'Registros de fichaje mediante códigos QR';
COMMENT ON COLUMN qr_clock_records.id IS 'Identificador único del registro';
COMMENT ON COLUMN qr_clock_records.employee_id IS 'ID del empleado';
COMMENT ON COLUMN qr_clock_records.employee_name IS 'Nombre del empleado';
COMMENT ON COLUMN qr_clock_records.location_id IS 'ID del local';
COMMENT ON COLUMN qr_clock_records.location_name IS 'Nombre del local';
COMMENT ON COLUMN qr_clock_records.timestamp IS 'Fecha y hora del fichaje';
COMMENT ON COLUMN qr_clock_records.clock_type IS 'Tipo de fichaje (entrada o salida)';
COMMENT ON COLUMN qr_clock_records.latitude IS 'Latitud de la ubicación del fichaje';
COMMENT ON COLUMN qr_clock_records.longitude IS 'Longitud de la ubicación del fichaje';
COMMENT ON COLUMN qr_clock_records.verified IS 'Indica si la ubicación del fichaje coincide con la del local';
COMMENT ON COLUMN qr_clock_records.created_at IS 'Fecha y hora de creación del registro';

