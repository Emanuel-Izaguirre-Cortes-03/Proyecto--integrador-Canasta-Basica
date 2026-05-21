-- Procedimiento para actualizar la tabla Clientes_RFM
-- Este procedimiento recalcula los valores RFM de todos los clientes

USE RetailOnlineDB_v2;
GO

-- Crear o modificar procedimiento almacenado
IF OBJECT_ID('sp_ActualizarRFM', 'P') IS NOT NULL
    DROP PROCEDURE sp_ActualizarRFM;
GO

CREATE PROCEDURE sp_ActualizarRFM
AS
BEGIN
    SET NOCOUNT ON;

    -- Limpiar la tabla actual
    TRUNCATE TABLE Clientes_RFM;

    -- Calcular RFM para cada VentaID (que representa al cliente en este sistema)
    INSERT INTO Clientes_RFM (ClienteID, Recencia, Frecuencia, MontoTotal, TicketPromedio, Tipo_Cliente)
    SELECT
        v.VentaID AS ClienteID,
        DATEDIFF(DAY, MAX(v.Fecha), GETDATE()) AS Recencia,
        COUNT(*) AS Frecuencia,
        SUM(v.Total) AS MontoTotal,
        AVG(v.Total) AS TicketPromedio,
        -- Clasificación RFM
        CASE
            -- Nuevo: compró muy recientemente (0-2 días) y pocas veces
            WHEN DATEDIFF(DAY, MAX(v.Fecha), GETDATE()) <= 2 AND COUNT(*) <= 2 THEN 'Nuevo'

            -- Inactivo: más de 120 días sin comprar y pocas compras
            WHEN DATEDIFF(DAY, MAX(v.Fecha), GETDATE()) > 120 AND COUNT(*) <= 3 THEN 'Inactivo'

            -- VIP: scoring alto (8-9 puntos)
            WHEN (
                CASE WHEN DATEDIFF(DAY, MAX(v.Fecha), GETDATE()) <= 7 THEN 3
                     WHEN DATEDIFF(DAY, MAX(v.Fecha), GETDATE()) <= 30 THEN 2
                     ELSE 1 END +
                CASE WHEN COUNT(*) >= 15 THEN 3
                     WHEN COUNT(*) >= 5 THEN 2
                     ELSE 1 END +
                CASE WHEN SUM(v.Total) >= 5000 THEN 3
                     WHEN SUM(v.Total) >= 1500 THEN 2
                     ELSE 1 END
            ) >= 8 THEN 'VIP'

            -- Regular: scoring medio (5-7 puntos) o por defecto
            ELSE 'Regular'
        END
    FROM Ventas v
    GROUP BY v.VentaID
    HAVING COUNT(*) > 0;

    -- Retornar estadísticas
    SELECT
        'Actualización completada' AS Mensaje,
        GETDATE() AS FechaActualizacion,
        COUNT(*) AS TotalClientes,
        SUM(CASE WHEN Tipo_Cliente = 'VIP' THEN 1 ELSE 0 END) AS Clientes_VIP,
        SUM(CASE WHEN Tipo_Cliente = 'Regular' THEN 1 ELSE 0 END) AS Clientes_Regular,
        SUM(CASE WHEN Tipo_Cliente = 'Nuevo' THEN 1 ELSE 0 END) AS Clientes_Nuevo,
        SUM(CASE WHEN Tipo_Cliente = 'Inactivo' THEN 1 ELSE 0 END) AS Clientes_Inactivo
    FROM Clientes_RFM;
END;
GO

-- Ejecutar el procedimiento por primera vez
EXEC sp_ActualizarRFM;
GO
