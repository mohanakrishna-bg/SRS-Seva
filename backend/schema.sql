-- ----------------------------------------------------------
-- MDB Tools - A library for reading MS Access database files
-- Copyright (C) 2000-2011 Brian Bruns and others.
-- Files in libmdb are licensed under LGPL and the utilities under
-- the GPL, see COPYING.LIB and COPYING files respectively.
-- Check out http://mdbtools.sourceforge.net
-- ----------------------------------------------------------

-- That file uses encoding UTF-8

CREATE TABLE `Customer`
 (
	`ID1`			INTEGER, 
	`ID`			varchar, 
	`Name`			varchar, 
	`Sgotra`			varchar, 
	`SNakshatra`			varchar, 
	`Address`			varchar, 
	`City`			varchar, 
	`Debitor`			varchar, 
	`Creditor`			varchar
	, PRIMARY KEY (`ID1`)
);

-- CREATE INDEXES ...
CREATE INDEX `Customer_AutoID_idx` ON `Customer` (`ID1`);
CREATE INDEX `Customer_ID_idx` ON `Customer` (`ID`);

CREATE TABLE `Gotra`
 (
	`GotraCode`			varchar
);

-- CREATE INDEXES ...
CREATE INDEX `Gotra_ModeCode_idx` ON `Gotra` (`GotraCode`);

CREATE TABLE `Invoice_Dtl`
 (
	`InvoiceNo`			varchar NOT NULL, 
	`ItemCode`			varchar NOT NULL, 
	`TotalQty`			INTEGER, 
	`Basic`			REAL, 
	`TPQty`			REAL, 
	`Amount`			REAL
	, PRIMARY KEY (`InvoiceNo`, `ItemCode`)
);

-- CREATE INDEXES ...
CREATE INDEX `Invoice_Dtl_Invoice_DtlInvoiceNo_idx` ON `Invoice_Dtl` (`InvoiceNo`);
CREATE INDEX `Invoice_Dtl_ItemCode_idx` ON `Invoice_Dtl` (`ItemCode`);

CREATE TABLE `Invoice_Hdr`
 (
	`InvoiceNo`			varchar NOT NULL, 
	`InvoiceDate`			DateTime NOT NULL, 
	`ID`			varchar NOT NULL, 
	`PO_Date`			DateTime NOT NULL, 
	`EntryTime`			varchar, 
	`Remarks`			varchar, 
	`ItemRateTotal`			REAL, 
	`TotalTPQty`			REAL, 
	`Adustment1`			REAL, 
	`Adustment2`			REAL, 
	`GrandTotal`			REAL, 
	`PaymentCode`			varchar NOT NULL, 
	`ChqNo`			varchar
	, PRIMARY KEY (`InvoiceNo`)
);

-- CREATE INDEXES ...
CREATE INDEX `Invoice_Hdr_PaymtCode_idx` ON `Invoice_Hdr` (`PaymentCode`);

CREATE TABLE `Item`
 (
	`ItemCode`			varchar, 
	`Description`			varchar, 
	`Basic`			REAL, 
	`TPQty`			REAL
);

-- CREATE INDEXES ...

CREATE TABLE `Item_Old`
 (
	`ItemCode`			varchar, 
	`Description`			varchar, 
	`Basic`			REAL, 
	`TPQty`			REAL
	, PRIMARY KEY (`ItemCode`)
);

-- CREATE INDEXES ...

CREATE TABLE `Nakshatra_Raashi`
 (
	`SNakshatra`			varchar NOT NULL, 
	`SRaashi`			varchar
);

-- CREATE INDEXES ...
CREATE INDEX `Nakshatra_Raashi_Description_idx` ON `Nakshatra_Raashi` (`SRaashi`);
CREATE INDEX `Nakshatra_Raashi_SNakshatra_idx` ON `Nakshatra_Raashi` (`SNakshatra`);

CREATE TABLE `Payment`
 (
	`PaymentCode`			varchar
);

-- CREATE INDEXES ...
CREATE INDEX `Payment_Payment days_idx` ON `Payment` (`PaymentCode`);

CREATE TABLE `PL_Seva`
 (
	`ID_PL`			INTEGER, 
	`Seva`			varchar, 
	`PL_Rate`			INTEGER
	, PRIMARY KEY (`ID_PL`)
);

-- CREATE INDEXES ...
CREATE INDEX `PL_Seva_ID_PL_idx` ON `PL_Seva` (`ID_PL`);

CREATE TABLE `PS_Receipts`
 (
	`PS_ID`			INTEGER, 
	`PS_RDate`			DateTime NOT NULL, 
	`PS_SDate`			DateTime NOT NULL, 
	`PS_Sevakartha`			varchar NOT NULL, 
	`SGotra`			varchar NOT NULL, 
	`SNakshatra`			varchar NOT NULL, 
	`SRaashi`			varchar, 
	`PS_Seva`			varchar, 
	`PS_Qty`			varchar, 
	`PS_Rate`			INTEGER, 
	`PS_Amount`			INTEGER, 
	`PS_Amt_Words`			varchar
	, PRIMARY KEY (`PS_ID`)
);

-- CREATE INDEXES ...
CREATE INDEX `PS_Receipts_PS_ID_idx` ON `PS_Receipts` (`PS_ID`);

CREATE TABLE `Security`
 (
	`User_Id`			varchar NOT NULL, 
	`Pass_Word`			varchar
	, PRIMARY KEY (`User_Id`)
);

-- CREATE INDEXES ...

CREATE TABLE `FinancialYear_Mst`
 (
	`Fycode`			varchar NOT NULL, 
	`Description`			varchar, 
	`StartDate`			DateTime NOT NULL, 
	`EndDate`			DateTime NOT NULL, 
	`PrevFycode`			varchar
	, PRIMARY KEY (`Fycode`)
);

-- CREATE INDEXES ...
CREATE UNIQUE INDEX `FinancialYear_Mst_EndDate_idx` ON `FinancialYear_Mst` (`EndDate`);
CREATE INDEX `FinancialYear_Mst_Fycode_idx` ON `FinancialYear_Mst` (`Fycode`);
CREATE UNIQUE INDEX `FinancialYear_Mst_PrevFycode_idx` ON `FinancialYear_Mst` (`PrevFycode`);
CREATE UNIQUE INDEX `FinancialYear_Mst_StartDate_idx` ON `FinancialYear_Mst` (`StartDate`);


