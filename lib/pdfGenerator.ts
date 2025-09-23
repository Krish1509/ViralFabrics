import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface OrderData {
  orderId: string;
  orderType?: string;
  arrivalDate?: Date;
  party?: {
    name: string;
  };
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  poNumber?: string;
  styleNo?: string;
  poDate?: Date;
  deliveryDate?: Date;
  items: Array<{
    quality?: {
      name: string;
    };
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
    description?: string;
    weaverSupplierName?: string;
    purchaseRate?: number;
    imageUrls?: string[];
  }>;
  status: string;
  totalAmount: number;
  finalAmount: number;
  createdAt: Date;
  notes?: string;
  // Mill data
  millInputs?: Array<{
    mill: {
      name: string;
    };
    millDate: Date;
    chalanNo: string;
    greighMtr: number;
    pcs: number;
    quality?: {
      name: string;
    };
    additionalMeters?: Array<{
      greighMtr: number;
      pcs: number;
      quality?: {
        name: string;
      };
    }>;
  }>;
  millOutputs?: Array<{
    recdDate: Date;
    millBillNo: string;
    finishedMtr: number;
    millRate: number;
    quality?: {
      name: string;
    };
  }>;
  dispatches?: Array<{
    dispatchDate: Date;
    billNo: string;
    finishMtr: number;
    saleRate: number;
    quality?: {
      name: string;
    };
    totalValue: number;
  }>;
}

export const generateOrderPDF = (order: OrderData): void => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Helper function to format date
  const formatDate = (date: Date | undefined): string => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };
  
  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return amount.toFixed(2);
  };

  // Calculate totals from real data
  const calculateTotals = () => {
    // Calculate total greigh meters from mill inputs
    const totalGreighMtr = order.millInputs?.reduce((total, input) => {
      const mainMtr = input.greighMtr || 0;
      const additionalMtr = input.additionalMeters?.reduce((sum, add) => sum + (add.greighMtr || 0), 0) || 0;
      return total + mainMtr + additionalMtr;
    }, 0) || 0;

    // Calculate total finished meters from mill outputs
    const totalFinishedMtr = order.millOutputs?.reduce((total, output) => total + (output.finishedMtr || 0), 0) || 0;

    // Calculate total dispatch meters
    const totalDispatchMtr = order.dispatches?.reduce((total, dispatch) => total + (dispatch.finishMtr || 0), 0) || 0;

    // Calculate total mill cost
    const totalMillCost = order.millOutputs?.reduce((total, output) => total + ((output.finishedMtr || 0) * (output.millRate || 0)), 0) || 0;

    // Calculate total sales value
    const totalSalesValue = order.dispatches?.reduce((total, dispatch) => total + (dispatch.totalValue || 0), 0) || 0;

    // Calculate total pieces from mill inputs
    const totalPieces = order.millInputs?.reduce((total, input) => {
      const mainPcs = input.pcs || 0;
      const additionalPcs = input.additionalMeters?.reduce((sum, add) => sum + (add.pcs || 0), 0) || 0;
      return total + mainPcs + additionalPcs;
    }, 0) || 0;

    return {
      totalGreighMtr,
      totalFinishedMtr,
      totalDispatchMtr,
      totalMillCost,
      totalSalesValue,
      totalPieces
    };
  };

  const totals = calculateTotals();
  
  let yPosition = 2; // Minimal top margin
  
  // Start directly with the header row
  
  // Top Section - Header Row (4 columns in one row with borders)
  doc.setFontSize(10); // Smaller font for compactness
  doc.setFont('helvetica', 'bold');
  
  const leftCol = 5; // Minimal left margin
  const rightCol = 105; // 50% of page width for right side
  
  // Create table-like header row with borders
  const headerRowY = yPosition;
  const cellHeight = 8; // Very compact height
  const cellWidth1 = 50; // PARTY
  const cellWidth2 = 40; // PO NO
  const cellWidth3 = 45; // PO DATE
  const cellWidth4 = 60; // DELIVERY DATE
  
  // Draw borders for header row
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3); // Thinner borders
  
  // Horizontal lines
  doc.line(leftCol, headerRowY, leftCol + cellWidth1 + cellWidth2 + cellWidth3 + cellWidth4, headerRowY);
  doc.line(leftCol, headerRowY + cellHeight, leftCol + cellWidth1 + cellWidth2 + cellWidth3 + cellWidth4, headerRowY + cellHeight);
  
  // Vertical lines
  doc.line(leftCol, headerRowY, leftCol, headerRowY + cellHeight);
  doc.line(leftCol + cellWidth1, headerRowY, leftCol + cellWidth1, headerRowY + cellHeight);
  doc.line(leftCol + cellWidth1 + cellWidth2, headerRowY, leftCol + cellWidth1 + cellWidth2, headerRowY + cellHeight);
  doc.line(leftCol + cellWidth1 + cellWidth2 + cellWidth3, headerRowY, leftCol + cellWidth1 + cellWidth2 + cellWidth3, headerRowY + cellHeight);
  doc.line(leftCol + cellWidth1 + cellWidth2 + cellWidth3 + cellWidth4, headerRowY, leftCol + cellWidth1 + cellWidth2 + cellWidth3 + cellWidth4, headerRowY + cellHeight);
  
  // Add text in each cell - minimal vertical gap
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8); // Smaller font for compactness
  
  // PARTY cell
  doc.text('PARTY:', leftCol + 2, headerRowY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 43, 89); // #002b59 color
  doc.text(order.party?.name || '', leftCol + 15, headerRowY + 5);
  doc.setTextColor(0, 0, 0); // Reset to black
  
  // PO NO cell
  doc.setFont('helvetica', 'bold');
  doc.text('PO NO:', leftCol + cellWidth1 + 2, headerRowY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 43, 89); // #002b59 color
  doc.text(order.poNumber || '', leftCol + cellWidth1 + 18, headerRowY + 5);
  doc.setTextColor(0, 0, 0); // Reset to black
  
  // PO DATE cell
  doc.setFont('helvetica', 'bold');
  doc.text('PO DATE:', leftCol + cellWidth1 + cellWidth2 + 2, headerRowY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 43, 89); // #002b59 color
  doc.text(formatDate(order.poDate) || '', leftCol + cellWidth1 + cellWidth2 + 18, headerRowY + 5);
  doc.setTextColor(0, 0, 0); // Reset to black
  
  // DELIVERY DATE cell
  doc.setFont('helvetica', 'bold');
  doc.text('DELIVERY DATE:', leftCol + cellWidth1 + cellWidth2 + cellWidth3 + 2, headerRowY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 43, 89); // #002b59 color
  doc.text(formatDate(order.deliveryDate) || '', leftCol + cellWidth1 + cellWidth2 + cellWidth3 + 35, headerRowY + 5);
  doc.setTextColor(0, 0, 0); // Reset to black
  
  yPosition = headerRowY + cellHeight + 5; // Reduced spacing
  
  // Left and Right Boxes
  if (order.items.length > 0) {
    const firstItem = order.items[0];
    
    // Left Box with bordered fields - bigger for 50% space
    const fieldHeight = 8; // Compact field height
    const fieldWidth = 95; // Bigger field width for 50% space
    
    // QUALITY field with border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(leftCol, yPosition, fieldWidth, fieldHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('QUALITY:', leftCol + 2, yPosition + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 43, 89); // #002b59 color
    doc.text(firstItem.quality?.name || '', leftCol + 20, yPosition + 5);
    doc.setTextColor(0, 0, 0); // Reset to black
    yPosition += fieldHeight; // No gap - fields touch each other
    
    // FINISH Qty field with border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(leftCol, yPosition, fieldWidth, fieldHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('FINISH Qty:', leftCol + 2, yPosition + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 43, 89); // #002b59 color
    doc.text(firstItem.quantity?.toString() || '', leftCol + 25, yPosition + 5);
    doc.setTextColor(0, 0, 0); // Reset to black
    yPosition += fieldHeight; // No gap - fields touch each other
    
    // GREY QTY field with border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(leftCol, yPosition, fieldWidth, fieldHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('GREY QTY:', leftCol + 2, yPosition + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 43, 89); // #002b59 color
    doc.text(totals.totalGreighMtr.toString(), leftCol + 25, yPosition + 5);
    doc.setTextColor(0, 0, 0); // Reset to black
    yPosition += fieldHeight + 3; // Minimal gap space between groups
    
    // Second group: CUTTING, STYLE, DESIGN/CD Number in one big box
    const secondGroupStartY = yPosition;
    const secondGroupHeight = (fieldHeight * 3) + 45; // Height for 3 fields with 10-row gap
    
    // Draw one big border for the second group
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(leftCol, secondGroupStartY, fieldWidth, secondGroupHeight);
    
    // CUTTING field (no individual border)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('CUTTING:', leftCol + 2, yPosition + 5);
    doc.setFont('helvetica', 'normal');
    doc.text('', leftCol + 25, yPosition + 5);
    yPosition += fieldHeight; // No gap - fields touch each other
    
    // STYLE field (no individual border)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('STYLE:', leftCol + 2, yPosition + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 43, 89); // #002b59 color
    doc.text(order.styleNo || '', leftCol + 20, yPosition + 5);
    doc.setTextColor(0, 0, 0); // Reset to black
    yPosition += fieldHeight + 45; // Reduced gap after STYLE
  
    // DESIGN / CD Number field (no individual border)
  doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('DESIGN / CD Number:', leftCol + 2, yPosition + 5);
    doc.setFont('helvetica', 'normal');
    doc.text('', leftCol + 45, yPosition + 5); // Moved further from border
    yPosition += fieldHeight + 10; // Reduced spacing
    
    // Right Box - positioned to match left side, 50% space
    const rightBoxY = headerRowY + cellHeight + 5; // Match left side start position
    const rightFieldWidth = 95; // Field width for right side (50% space)
    
    // PURCHASE field with border - centered text
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(rightCol, rightBoxY, rightFieldWidth, fieldHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('PURCHASE:', rightCol + 2, rightBoxY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 43, 89); // #002b59 color
    doc.text(`₹${formatCurrency(totals.totalMillCost)}`, rightCol + 25, rightBoxY + 5);
    doc.setTextColor(0, 0, 0); // Reset to black
    let rightY = rightBoxY + fieldHeight; // No gap - fields touch each other
    
    // WEAVER field with border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(rightCol, rightY, rightFieldWidth, fieldHeight);
  doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('WEAVER:', rightCol + 2, rightY + 5);
  doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 43, 89); // #002b59 color
    doc.text(firstItem.weaverSupplierName || '', rightCol + 20, rightY + 5);
    doc.setTextColor(0, 0, 0); // Reset to black
    rightY += fieldHeight; // No gap - fields touch each other
    
    // ORDER QTY and RATE in one row - single field without vertical line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(rightCol, rightY, rightFieldWidth, fieldHeight);
  doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('ORDER QTY:', rightCol + 2, rightY + 5);
    doc.text('RATE:', rightCol + 50, rightY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 43, 89); // #002b59 color
    doc.text(firstItem.quantity?.toString() || '', rightCol + 25, rightY + 5); // Real order quantity
    doc.text(`₹${firstItem.purchaseRate?.toFixed(0) || ''}`, rightCol + 60, rightY + 5); // Real purchase rate
    doc.setTextColor(0, 0, 0); // Reset to black
    
    rightY += fieldHeight; // No gap - fields touch each other
    
    // Main Table (Right side below the fields) - 50% space
    const tableStartY = rightY;
    const tableWidth = 95; // Table width (50% space)
    const tableRowHeight = 8; // Row height
    const colWidth = 23; // Column width (adjusted for bigger table)
    
    // Table header
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(rightCol, tableStartY, tableWidth, tableRowHeight);
    
    // Header text
  doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('DATE', rightCol + 2, tableStartY + 5);
    doc.text('CH NO', rightCol + colWidth + 2, tableStartY + 5);
    doc.text('TAKA', rightCol + (colWidth * 2) + 2, tableStartY + 5);
    doc.text('MTR', rightCol + (colWidth * 3) + 2, tableStartY + 5);
    
    // Add vertical lines for columns
    doc.line(rightCol + colWidth, tableStartY, rightCol + colWidth, tableStartY + tableRowHeight);
    doc.line(rightCol + (colWidth * 2), tableStartY, rightCol + (colWidth * 2), tableStartY + tableRowHeight);
    doc.line(rightCol + (colWidth * 3), tableStartY, rightCol + (colWidth * 3), tableStartY + tableRowHeight);
    
    // Data rows with real mill input data
    let tableY = tableStartY + tableRowHeight;
    
    // Fill table with real mill input data
    const millInputsToShow = order.millInputs?.slice(0, 4) || []; // Show up to 4 entries
    
    for (let i = 0; i < 4; i++) {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.rect(rightCol, tableY, tableWidth, tableRowHeight);
      
      if (i < millInputsToShow.length) {
        const millInput = millInputsToShow[i];
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(0, 43, 89); // #002b59 color
        
        // DATE
        doc.text(formatDate(millInput.millDate), rightCol + 2, tableY + 5);
        // CH NO (Chalan Number)
        doc.text(millInput.chalanNo || '', rightCol + colWidth + 2, tableY + 5);
        // TAKA (Total cost - calculated from greigh meters * rate)
        const totalCost = (millInput.greighMtr || 0) * (firstItem.purchaseRate || 0);
        doc.text(`₹${formatCurrency(totalCost)}`, rightCol + (colWidth * 2) + 2, tableY + 5);
        // MTR (Greigh Meters)
        doc.text(millInput.greighMtr?.toString() || '', rightCol + (colWidth * 3) + 2, tableY + 5);
        
        doc.setTextColor(0, 0, 0); // Reset to black
      } else {
        // Empty row
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('', rightCol + 2, tableY + 5);
        doc.text('', rightCol + colWidth + 2, tableY + 5);
        doc.text('', rightCol + (colWidth * 2) + 2, tableY + 5);
        doc.text('', rightCol + (colWidth * 3) + 2, tableY + 5);
      }
                    
      // Add vertical lines for columns
      doc.line(rightCol + colWidth, tableY, rightCol + colWidth, tableY + tableRowHeight);
      doc.line(rightCol + (colWidth * 2), tableY, rightCol + (colWidth * 2), tableY + tableRowHeight);
      doc.line(rightCol + (colWidth * 3), tableY, rightCol + (colWidth * 3), tableY + tableRowHeight);
      
      tableY += tableRowHeight;
    }
    
    // Move outside table structure for TOTAL and GREY REPORT
    // No gap - TOTAL row touches table directly
    
    // TOTAL row - with border but no vertical lines
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(rightCol, tableY, tableWidth, tableRowHeight); // Full border only
  doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('TOTAL:', rightCol + 2, tableY + 5);
    doc.setTextColor(0, 43, 89); // #002b59 color
    // Calculate total cost from all mill inputs
    const totalMillInputCost = order.millInputs?.reduce((total, input) => {
      const mainCost = (input.greighMtr || 0) * (firstItem.purchaseRate || 0);
      const additionalCost = input.additionalMeters?.reduce((sum, add) => sum + ((add.greighMtr || 0) * (firstItem.purchaseRate || 0)), 0) || 0;
      return total + mainCost + additionalCost;
    }, 0) || 0;
    doc.text(`₹${formatCurrency(totalMillInputCost)}`, rightCol + (colWidth * 2) + 2, tableY + 5); // Total cost
    doc.text(totals.totalGreighMtr.toString(), rightCol + (colWidth * 3) + 2, tableY + 5); // Total meters
    doc.setTextColor(0, 0, 0); // Reset to black
    
    // No vertical lines - single field without internal dividers
    
    tableY += tableRowHeight; // No gap - fields touch each other
    
    // GREY REPORT section - single bordered box with "L:" and "GREY REPORT:" stacked
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(rightCol, tableY, tableWidth, tableRowHeight * 3); // Taller box for two lines
  doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('L:', rightCol + tableWidth -74, tableY + 5); // L: on right side
    doc.text('GREY REPORT:', rightCol + 2, tableY + 9); // GREY REPORT on left side, closer to L:
    
    // Add real data in GREY REPORT section
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(0, 43, 89); // #002b59 color
    doc.text(`Total Greigh: ${totals.totalGreighMtr}m`, rightCol + 2, tableY + 15);
    doc.text(`Total Pieces: ${totals.totalPieces}`, rightCol + 2, tableY + 19);
    doc.setTextColor(0, 0, 0); // Reset to black
    
    tableY += tableRowHeight * 3 + 4; // Space after GREY REPORT
    
    // Create professional table structure
    const professionalTableStartY = tableY;
    const fullTableWidth = pageWidth - 10; // Bigger width to match other elements
    const section1Width = fullTableWidth * 0.30; // ISSUE TO MILL - 30%
    const section2Width = fullTableWidth * 0.40; // REC FROM MILL - 40%
    const section3Width = fullTableWidth * 0.30; // SALES - 30%
    const tableHeight = 68; // Adjusted table height for 6 data rows + 1 TOTAL row
    const rowHeight = 10; // Compact row height
    
    // First row - Main headers with borders
    const headerRowHeight = 12; // Increased height to accommodate two-line headers
    
    // Draw border around header row - positioned to match other elements
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(5, professionalTableStartY, fullTableWidth, headerRowHeight);
    
    // Draw vertical dividers for header columns
    doc.line(5 + section1Width, professionalTableStartY, 5 + section1Width, professionalTableStartY + headerRowHeight);
    doc.line(5 + section1Width + section2Width, professionalTableStartY, 5 + section1Width + section2Width, professionalTableStartY + headerRowHeight);
    
    // Add header text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    // ISSUE TO MILL header - centered
    doc.text('ISSUE TO MILL', 5 + section1Width/2, professionalTableStartY + 5, { align: 'center' });
    
    // REC FROM MILL header - centered
    doc.text('REC FROM MILL', 5 + section1Width + section2Width/2, professionalTableStartY + 5, { align: 'center' });
    
    // SALES header - centered
    doc.text('SALES', 5 + section1Width + section2Width + section3Width/2, professionalTableStartY + 5, { align: 'center' });
    
    tableY = professionalTableStartY + headerRowHeight + 0;
    
    // Draw main table border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(5, tableY, fullTableWidth, tableHeight);
    
    // Draw vertical section dividers
    doc.line(5 + section1Width, tableY, 5 + section1Width, tableY + tableHeight);
    doc.line(5 + section1Width + section2Width, tableY, 5 + section1Width + section2Width, tableY + tableHeight);
    
    // Second row - Sub headers and MILL field
    const headerY = tableY + 4;
    doc.setFontSize(8);
    
    // ISSUE TO MILL - MILL field
    doc.text('MILL:', 8, headerY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 43, 89); // #002b59 color
    // Show first mill name if available
    const firstMill = order.millInputs?.[0]?.mill?.name || '';
    doc.text(firstMill, 20, headerY);
    doc.setTextColor(0, 0, 0); // Reset to black
    
    // ISSUE TO MILL table structure - DATE, C.NO, TAKA, MTR as column headers
    const issueDateWidth = section1Width * 0.30; // 30%
    const issueCnoWidth = section1Width * 0.20; // 20%
    const issueTakaWidth = section1Width * 0.20; // 20%
    const issueMtrWidth = section1Width * 0.30; // 30%
    
    // ISSUE TO MILL column headers - integrated with main table
    // doc.setFont('helvetica', 'bold');
    // doc.setFontSize(8);
    // doc.text('DATE', 8, headerY + 5);
    // doc.text('C.NO', 8 + issueDateWidth, headerY + 5);
    // doc.text('TAKA', 8 + issueDateWidth + issueCnoWidth, headerY + 5);
    // doc.text('MTR', 8 + issueDateWidth + issueCnoWidth + issueTakaWidth, headerY + 5);
    
    // REC FROM MILL columns - percentage-based spacing for 40% width
    const dateWidth = section2Width * 0.20; // 10%
    const chNoWidth = section2Width * 0.15; // 15%
    const ltNoWidth = section2Width * 0.15; // 15%
    const gmtWidth = section2Width * 0.20; // 20%
    const fmtWidth = section2Width * 0.20; // 20%
    const shtWidth = section2Width * 0.10; // 10%
    
    doc.setFont('helvetica', 'bold');
    doc.text('DATE', 8 + section1Width, headerY);
    doc.text('CH', 8 + section1Width + dateWidth, headerY);
    doc.text('NO', 8 + section1Width + dateWidth, headerY + 4);
    doc.text('L.T', 8 + section1Width + dateWidth + chNoWidth, headerY);
    doc.text('NO', 8 + section1Width + dateWidth + chNoWidth, headerY + 4);
    doc.text('G.MT', 8 + section1Width + dateWidth + chNoWidth + ltNoWidth, headerY);
    doc.text('F.MT', 8 + section1Width + dateWidth + chNoWidth + ltNoWidth + gmtWidth, headerY);
    doc.text('SH', 8 + section1Width + dateWidth + chNoWidth + ltNoWidth + gmtWidth + fmtWidth, headerY);
    doc.text('T', 8 + section1Width + dateWidth + chNoWidth + ltNoWidth + gmtWidth + fmtWidth, headerY + 4);
    
    // SALES columns - percentage-based spacing for 30% width
    const salesDateWidth = section3Width * 0.30; // 30%
    const salesBillWidth = section3Width * 0.20; // 20%
    const salesParcelWidth = section3Width * 0.20; // 20%
    const salesMtrWidth = section3Width * 0.30; // 30%
    
    doc.text('DATE', 8 + section1Width + section2Width, headerY);
    doc.text('BILL', 8 + section1Width + section2Width + salesDateWidth, headerY);
    doc.text('PAR', 8 + section1Width + section2Width + salesDateWidth + salesBillWidth, headerY);
    doc.text('CEL', 8 + section1Width + section2Width + salesDateWidth + salesBillWidth, headerY + 4);
    doc.text('MTR', 8 + section1Width + section2Width + salesDateWidth + salesBillWidth + salesParcelWidth, headerY);
    
    // Add horizontal line after all column headers
    doc.line(5, headerY + 8, 5 + fullTableWidth, headerY + 8);
    
    // Add 6 empty data rows + 1 TOTAL row
    const dataRowHeight = 8; // Height of each row
    let currentDataRowY = headerY + 8; // Start after the horizontal line
    
    // Draw 6 data rows with real data
    for (let i = 0; i < 6; i++) {
      currentDataRowY += dataRowHeight;
      
      // Draw horizontal line for this row
      doc.line(5, currentDataRowY, 5 + fullTableWidth, currentDataRowY);
      
      // Add real data to each row
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(0, 43, 89); // #002b59 color
      
      // ISSUE TO MILL section data
      if (i < (order.millInputs?.length || 0)) {
        const millInput = order.millInputs![i];
        doc.text(formatDate(millInput.millDate), 8, currentDataRowY - 3);
        doc.text(millInput.chalanNo || '', 8 + issueDateWidth, currentDataRowY - 3);
        const cost = (millInput.greighMtr || 0) * (firstItem.purchaseRate || 0);
        doc.text(`₹${formatCurrency(cost)}`, 8 + issueDateWidth + issueCnoWidth, currentDataRowY - 3);
        doc.text(millInput.greighMtr?.toString() || '', 8 + issueDateWidth + issueCnoWidth + issueTakaWidth, currentDataRowY - 3);
      }
      
      // REC FROM MILL section data
      if (i < (order.millOutputs?.length || 0)) {
        const millOutput = order.millOutputs![i];
        doc.text(formatDate(millOutput.recdDate), 8 + section1Width, currentDataRowY - 3);
        doc.text(millOutput.millBillNo || '', 8 + section1Width + dateWidth, currentDataRowY - 3);
        doc.text('', 8 + section1Width + dateWidth + chNoWidth, currentDataRowY - 3); // L.T NO
        doc.text(millOutput.finishedMtr?.toString() || '', 8 + section1Width + dateWidth + chNoWidth + ltNoWidth, currentDataRowY - 3);
        doc.text(millOutput.finishedMtr?.toString() || '', 8 + section1Width + dateWidth + chNoWidth + ltNoWidth + gmtWidth, currentDataRowY - 3);
        doc.text('', 8 + section1Width + dateWidth + chNoWidth + ltNoWidth + gmtWidth + fmtWidth, currentDataRowY - 3); // SHT
      }
      
      // SALES section data
      if (i < (order.dispatches?.length || 0)) {
        const dispatch = order.dispatches![i];
        doc.text(formatDate(dispatch.dispatchDate), 8 + section1Width + section2Width, currentDataRowY - 3);
        doc.text(dispatch.billNo || '', 8 + section1Width + section2Width + salesDateWidth, currentDataRowY - 3);
        doc.text('', 8 + section1Width + section2Width + salesDateWidth + salesBillWidth, currentDataRowY - 3); // PARCEL
        doc.text(dispatch.finishMtr?.toString() || '', 8 + section1Width + section2Width + salesDateWidth + salesBillWidth + salesParcelWidth, currentDataRowY - 3);
      }
      
      doc.setTextColor(0, 0, 0); // Reset to black
      
      // Add vertical borders for each section in this row
      // ISSUE TO MILL section vertical borders
      doc.line(5 + issueDateWidth, currentDataRowY - dataRowHeight, 5 + issueDateWidth, currentDataRowY);
      doc.line(5 + issueDateWidth + issueCnoWidth, currentDataRowY - dataRowHeight, 5 + issueDateWidth + issueCnoWidth, currentDataRowY);
      doc.line(5 + issueDateWidth + issueCnoWidth + issueTakaWidth, currentDataRowY - dataRowHeight, 5 + issueDateWidth + issueCnoWidth + issueTakaWidth, currentDataRowY);
      
      // REC FROM MILL section - no vertical lines after TOTAL
      
      // SALES section vertical borders
      doc.line(5 + section1Width + section2Width + salesDateWidth, currentDataRowY - dataRowHeight, 5 + section1Width + section2Width + salesDateWidth, currentDataRowY);
      doc.line(5 + section1Width + section2Width + salesDateWidth + salesBillWidth, currentDataRowY - dataRowHeight, 5 + section1Width + section2Width + salesDateWidth + salesBillWidth, currentDataRowY);
      doc.line(5 + section1Width + section2Width + salesDateWidth + salesBillWidth + salesParcelWidth, currentDataRowY - dataRowHeight, 5 + section1Width + section2Width + salesDateWidth + salesBillWidth + salesParcelWidth, currentDataRowY);
    }
    
    // Add 8th row with TOTAL
    currentDataRowY += dataRowHeight;
    doc.line(5, currentDataRowY, 5 + fullTableWidth, currentDataRowY);
    
    // Add TOTAL text in all three sections with real calculated totals
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 43, 89); // #002b59 color
    
    // TOTAL in ISSUE TO MILL section
    doc.text('TOTAL:', 8, currentDataRowY - 3);
    doc.text(`₹${formatCurrency(totalMillInputCost)}`, 8 + issueDateWidth + issueCnoWidth, currentDataRowY - 3);
    doc.text(totals.totalGreighMtr.toString(), 8 + issueDateWidth + issueCnoWidth + issueTakaWidth, currentDataRowY - 3);
    
    // Add vertical lines for TAKA and MTR columns in ISSUE TO MILL section
    doc.line(5 + issueDateWidth + issueCnoWidth, currentDataRowY - dataRowHeight, 5 + issueDateWidth + issueCnoWidth, currentDataRowY);
    doc.line(5 + issueDateWidth + issueCnoWidth + issueTakaWidth, currentDataRowY - dataRowHeight, 5 + issueDateWidth + issueCnoWidth + issueTakaWidth, currentDataRowY);
    
    // TOTAL in REC FROM MILL section
    doc.text('TOTAL:', 8 + section1Width, currentDataRowY - 3);
    doc.text(`₹${formatCurrency(totals.totalMillCost)}`, 8 + section1Width + dateWidth + chNoWidth + ltNoWidth, currentDataRowY - 3);
    doc.text(totals.totalFinishedMtr.toString(), 8 + section1Width + dateWidth + chNoWidth + ltNoWidth + gmtWidth, currentDataRowY - 3);
    
    // TOTAL in SALES section
    doc.text('TOTAL:', 8 + section1Width + section2Width, currentDataRowY - 3);
    doc.text(`₹${formatCurrency(totals.totalSalesValue)}`, 8 + section1Width + section2Width + salesDateWidth + salesBillWidth, currentDataRowY - 3);
    doc.text(totals.totalDispatchMtr.toString(), 8 + section1Width + section2Width + salesDateWidth + salesBillWidth + salesParcelWidth, currentDataRowY - 3);
    
    doc.setTextColor(0, 0, 0); // Reset to black
    
    // Add internal vertical borders for each section
    // ISSUE TO MILL section - separate table created above with proper borders
    
    // REC FROM MILL section internal borders - percentage-based spacing
    doc.line(5 + section1Width + dateWidth, tableY, 5 + section1Width + dateWidth, tableY + tableHeight);
    doc.line(5 + section1Width + dateWidth + chNoWidth, tableY, 5 + section1Width + dateWidth + chNoWidth, tableY + tableHeight);
    doc.line(5 + section1Width + dateWidth + chNoWidth + ltNoWidth, tableY, 5 + section1Width + dateWidth + chNoWidth + ltNoWidth, tableY + tableHeight);
    doc.line(5 + section1Width + dateWidth + chNoWidth + ltNoWidth + gmtWidth, tableY, 5 + section1Width + dateWidth + chNoWidth + ltNoWidth + gmtWidth, tableY + tableHeight);
    doc.line(5 + section1Width + dateWidth + chNoWidth + ltNoWidth + gmtWidth + fmtWidth, tableY, 5 + section1Width + dateWidth + chNoWidth + ltNoWidth + gmtWidth + fmtWidth, tableY + tableHeight);
    
    // SALES section internal borders - percentage-based spacing
    doc.line(5 + section1Width + section2Width + salesDateWidth, tableY, 5 + section1Width + section2Width + salesDateWidth, tableY + tableHeight);
    doc.line(5 + section1Width + section2Width + salesDateWidth + salesBillWidth, tableY, 5 + section1Width + section2Width + salesDateWidth + salesBillWidth, tableY + tableHeight);
    doc.line(5 + section1Width + section2Width + salesDateWidth + salesBillWidth + salesParcelWidth, tableY, 5 + section1Width + section2Width + salesDateWidth + salesBillWidth + salesParcelWidth, tableY + tableHeight);
    
    // No data rows - just the table structure with headers
  }
  
  // Add WASTAGE REPORT and FINAL REPORT sections
  const reportStartY = 220; // Position below the main table with more margin
  const reportBoxHeight = 40; // Increased height for more space
  const reportBoxWidth = (pageWidth - 10) / 2; // Half width for each box to fit properly
  
  // WASTAGE REPORT section (left side)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(5, reportStartY, reportBoxWidth, reportBoxHeight);
  
  // WASTAGE REPORT header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('WASTAGE REPORT:', 8, reportStartY + 6);
  
  // First horizontal line after header
  doc.line(5, reportStartY + 8, 5 + reportBoxWidth, reportStartY + 8);
  
  // CHINDI field
  doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
  doc.text('CHINDI:', 8, reportStartY + 12);
  
  // Second horizontal line after CHINDI
  doc.line(5, reportStartY + 14, 5 + reportBoxWidth, reportStartY + 14);
  
  // CUT PIC field
  doc.setFont('helvetica', 'bold');
  doc.text('CUT PIC:', 8, reportStartY + 18);
  
  // Third horizontal line after CUT PIC
  doc.line(5, reportStartY + 20, 5 + reportBoxWidth, reportStartY + 20);
  
  // Just free space - no extra lines
  
  // FINAL REPORT section (right side) - no gap between sections
  const finalReportX = 5 + reportBoxWidth; // No gap - sections touch each other
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(finalReportX, reportStartY, reportBoxWidth, reportBoxHeight);
  
  // FINAL REPORT header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('FINAL REPORT:', finalReportX + 3, reportStartY + 6);
  
  // Just empty space - no text content
  
  // Bottom signature section - one row with 3 columns
  const signatureStartY = reportStartY + reportBoxHeight + 10; // Position below report sections
  const signatureRowHeight = 15; // Height for signature row
  const signatureColWidth = (pageWidth - 10) / 3; // Equal width for 3 columns
  
  // Draw border around entire signature row
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(5, signatureStartY, pageWidth - 10, signatureRowHeight);
  
  // Draw vertical dividers for 3 columns
  doc.line(5 + signatureColWidth, signatureStartY, 5 + signatureColWidth, signatureStartY + signatureRowHeight);
  doc.line(5 + (signatureColWidth * 2), signatureStartY, 5 + (signatureColWidth * 2), signatureStartY + signatureRowHeight);
  
  // Office sign section (left column) - just text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('OFFICE SIGN:', 8, signatureStartY + 5);
  
  // Mill sign section (middle column) - just text
  doc.setFont('helvetica', 'bold');
  doc.text('MILL SIGN:', 8 + signatureColWidth, signatureStartY + 5);
  
  // Final sign section (right column) - just text
  doc.setFont('helvetica', 'bold');
  doc.text('FINAL SIGN:', 8 + (signatureColWidth * 2), signatureStartY + 5);
  
  // Download the PDF
  const fileName = `FABRIC_PURCHASE_ORDER_SHEET_${order.orderId}_${formatDate(new Date()).replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
};
