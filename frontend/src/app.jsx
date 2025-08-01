"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Upload,
  Download,
  Trash2,
  Database,
  FileSpreadsheet,
  X,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Globe,
  ExternalLink,
} from "lucide-react";
import WebTerminal from "./components/web-terminal";
import { useToast } from "./components/toast";
import { ModernCheckbox } from "./components/ui-components";
import * as XLSX from "xlsx";

const API_URL = "http://localhost:5001/api";

const translations = {
  en: {
    title: "Excel Database Manager",
    searchAllTables: "Search in all tables...",
    search: "Search",
    terminal: "Terminal",
    uploadExcel: "Upload Excel",
    uploading: "Uploading...",
    dragDropHere: "Drop file here",
    dragDropTitle: "Drop Excel File Here",
    dragDropDescription: "Drag and drop your Excel file here",
    invalidFileType: "Please select a valid Excel file (.xlsx, .xls, .csv)",
    tables: "Tables",
    noTables: "No tables yet",
    startByUploading: "Start by uploading an Excel file",
    records: "records",
    pages: "pages",
    searchInTable: "Search in table...",
    downloadAsExcel: "Download as Excel",
    downloadFormat: "Download Format",
    downloadAsXLSX: "Download as XLSX",
    downloadAsCSV: "Download as CSV",
    deleteTable: "Delete table",
    loading: "Loading...",
    noSearchResults: "No search results found",
    noDataInTable: "No data in this table yet",
    clearSearch: "Clear search",
    selectTable: "Select Table",
    selectFromLeft: "Select a table from the left panel to view",
    searchResults: "Search Results",
    openTable: "Go to Table",
    totalRecords: "Total",
    fileUploadSuccess: "File uploaded successfully! Created tables:",
    error: "Error:",
    uploadError: "Upload error:",
    exportError: "Export error:",
    confirmDelete: "Are you sure you want to delete the table",
    tableDeletedSuccess: "Table deleted successfully",
    deleteError: "Delete error:",
    tablesLoadError: "Tables could not be loaded:",
    tableDataLoadError: "Table data could not be loaded:",
    searchError: "Search error:",
    openTerminal: "Open CLI Terminal",
    resultsInTable: "results in",
    filterResults: "Filter results...",
    selectAll: "Select All",
    selectedRows: "selected rows",
    downloadSelected: "Download Selected",
    clearSelection: "Clear Selection",
    searchPerformed: "Search performed for:",
    tryDifferentSearch: "Try a different search term",
    downloadingFile: "Downloading file...",
    downloadComplete: "Download completed successfully",
    downloadFailed: "Download failed",
    exportingSelected: "Exporting selected rows...",
    exportComplete: "Selected rows exported successfully",
    exportFailed: "Export failed",
  },
  tr: {
    title: "Excel Veritabanı Yöneticisi",
    searchAllTables: "Tüm tablolarda ara...",
    search: "Ara",
    terminal: "Terminal",
    uploadExcel: "Excel Yükle",
    uploading: "Yükleniyor...",
    dragDropHere: "Dosyayı bırakın",
    dragDropTitle: "Excel Dosyasını Bırakın",
    dragDropDescription: "Excel dosyanızı buraya sürükleyip bırakın",
    invalidFileType:
      "Lütfen geçerli bir Excel dosyası (.xlsx, .xls, .csv) seçin",
    tables: "Tablolar",
    noTables: "Henüz tablo yok",
    startByUploading: "Excel dosyası yükleyerek başlayın",
    records: "kayıt",
    pages: "sayfa",
    searchInTable: "Tabloda ara...",
    downloadAsExcel: "Excel olarak indir",
    downloadFormat: "İndirme Formatı",
    downloadAsXLSX: "XLSX olarak indir",
    downloadAsCSV: "CSV olarak indir",
    deleteTable: "Tabloyu sil",
    loading: "Yükleniyor...",
    noSearchResults: "Arama sonucu bulunamadı",
    noDataInTable: "Bu tabloda henüz veri yok",
    clearSearch: "Aramayı temizle",
    selectTable: "Tablo Seçin",
    selectFromLeft: "Görüntülemek için sol panelden bir tablo seçin",
    searchResults: "Arama Sonuçları",
    openTable: "Tabloya Git",
    totalRecords: "Toplam",
    fileUploadSuccess: "Dosya başarıyla yüklendi! Oluşturulan tablolar:",
    error: "Hata:",
    uploadError: "Yükleme hatası:",
    exportError: "Dışa aktarma hatası:",
    confirmDelete: "tablosunu silmek istediğinizden emin misiniz?",
    tableDeletedSuccess: "Tablo başarıyla silindi",
    deleteError: "Silme hatası:",
    tablesLoadError: "Tablolar yüklenemedi:",
    tableDataLoadError: "Tablo verisi yüklenemedi:",
    searchError: "Arama hatası:",
    openTerminal: "CLI Terminal'i Aç",
    resultsInTable: "sonuç",
    filterResults: "Sonuçları filtrele...",
    selectAll: "Tümünü Seç",
    selectedRows: "seçili satır",
    downloadSelected: "Seçilenleri İndir",
    clearSelection: "Seçimi Temizle",
    searchPerformed: "Arama yapıldı:",
    tryDifferentSearch: "Farklı bir arama terimi deneyin",
    downloadingFile: "Dosya indiriliyor...",
    downloadComplete: "İndirme başarıyla tamamlandı",
    downloadFailed: "İndirme başarısız",
    exportingSelected: "Seçili satırlar dışa aktarılıyor...",
    exportComplete: "Seçili satırlar başarıyla dışa aktarıldı",
    exportFailed: "Dışa aktarma başarısız",
  },
};

export default function DatabaseApp() {
  const [editingCell, setEditingCell] = useState(null);

  const [editingTableName, setEditingTableName] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [rowEditModal, setRowEditModal] = useState({ open: false, row: null });
  const [rowEditData, setRowEditData] = useState({});
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [filteredSearchResults, setFilteredSearchResults] = useState([]);
  const [resultsFilterQuery, setResultsFilterQuery] = useState("");
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchTerm, setLastSearchTerm] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
  const [selectedDropdownOpen, setSelectedDropdownOpen] = useState(false);

  const searchResultsRef = useRef(null);
  const fileInputRef = useRef(null);
  const downloadDropdownRef = useRef(null);
  const selectedDropdownRef = useRef(null);
  const { addToast, ToastContainer } = useToast();
  const t = translations[language];

  useEffect(() => {
    fetchTables();

    const handleWindowDragEnter = (e) => {
      e.preventDefault();
      if (e.dataTransfer.types && e.dataTransfer.types.includes("Files")) {
        setDragCounter((prev) => prev + 1);
        setDragActive(true);
      }
    };

    const handleWindowDragLeave = (e) => {
      e.preventDefault();
      setDragCounter((prev) => {
        const newCount = prev - 1;
        if (newCount <= 0) {
          setDragActive(false);
          return 0;
        }
        return newCount;
      });
    };

    const handleWindowDragOver = (e) => {
      e.preventDefault();
      if (e.dataTransfer.types && e.dataTransfer.types.includes("Files")) {
        e.dataTransfer.dropEffect = "copy";
      }
    };

    const handleWindowDrop = (e) => {
      e.preventDefault();
      setDragActive(false);
      setDragCounter(0);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (
          file.type ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          file.type === "application/vnd.ms-excel" ||
          file.name.endsWith(".xlsx") ||
          file.name.endsWith(".xls") ||
          file.name.endsWith(".csv")
        ) {
          handleFileUpload(file);
        } else {
          addToast(t.invalidFileType, "error");
        }
      }
    };

    window.addEventListener("dragenter", handleWindowDragEnter);
    window.addEventListener("dragleave", handleWindowDragLeave);
    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("drop", handleWindowDrop);

    return () => {
      window.removeEventListener("dragenter", handleWindowDragEnter);
      window.removeEventListener("dragleave", handleWindowDragLeave);
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("drop", handleWindowDrop);
    };
  }, [t.invalidFileType]);

  useEffect(() => {
    setResultsFilterQuery(globalSearchQuery);
  }, [globalSearchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        downloadDropdownRef.current &&
        !downloadDropdownRef.current.contains(event.target)
      ) {
        setDownloadDropdownOpen(false);
      }
      if (
        selectedDropdownRef.current &&
        !selectedDropdownRef.current.contains(event.target)
      ) {
        setSelectedDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (resultsFilterQuery && resultsFilterQuery !== globalSearchQuery) {
      const timeoutId = setTimeout(async () => {
        if (!resultsFilterQuery.trim()) {
          setFilteredSearchResults([]);
          return;
        }

        let loadingTimeout = setTimeout(() => {
          setFilterLoading(true);
        }, 500);

        try {
          const response = await fetch(
            `${API_URL}/search?q=${encodeURIComponent(resultsFilterQuery)}&limit=5000`,
          );
          const data = await response.json();

          clearTimeout(loadingTimeout);

          setFilteredSearchResults(data.results || []);
        } catch (error) {
          clearTimeout(loadingTimeout);
          console.error(t.searchError, error);
          setFilteredSearchResults([]);
        } finally {
          setFilterLoading(false);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setFilteredSearchResults(globalSearchResults);
    }
  }, [resultsFilterQuery, globalSearchResults, globalSearchQuery]);

  useEffect(() => {
    setSelectedRows(new Set());
  }, [selectedTable, currentPage]);

  const fetchTables = async () => {
    try {
      const response = await fetch(`${API_URL}/tables`);
      const data = await response.json();
      setTables(data);
    } catch (error) {
      console.error(t.tablesLoadError, error);
      addToast(t.tablesLoadError, "error");
    }
  };

  const fetchTableData = async (tableName, page = 1, search = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: "20",
        search: search,
      });
      const response = await fetch(`${API_URL}/tables/${tableName}?${params}`);
      const data = await response.json();
      setTableData(data);
      setCurrentPage(page);
    } catch (error) {
      console.error(t.tableDataLoadError, error);
      addToast(t.tableDataLoadError, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = (tableName) => {
    setSelectedTable(tableName);
    setSearchQuery("");
    setSelectedRows(new Set());
    fetchTableData(tableName);

    setTimeout(() => {
      const tableElement = document.querySelector(
        ".flex-1.bg-white.rounded-xl",
      );
      if (tableElement) {
        tableElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (selectedTable) {
      fetchTableData(selectedTable, 1, searchQuery);
    }
  };

  const handleGlobalSearch = async (e) => {
    e.preventDefault();
    if (!globalSearchQuery.trim()) return;

    let loadingTimeout = setTimeout(() => {
      setSearchLoading(true);
    }, 300);

    setHasSearched(true);
    setLastSearchTerm(globalSearchQuery);

    try {
      const response = await fetch(
        `${API_URL}/search?q=${encodeURIComponent(globalSearchQuery)}&limit=5000`,
      );
      const data = await response.json();

      clearTimeout(loadingTimeout);

      console.log("Search response:", data);

      setGlobalSearchResults(data.results || []);
      setFilteredSearchResults(data.results || []);

      if (data.results && data.results.length > 0) {
        setTimeout(() => {
          if (searchResultsRef.current) {
            searchResultsRef.current.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }, 100);
      }
    } catch (error) {
      clearTimeout(loadingTimeout);
      console.error(t.searchError, error);
      addToast(t.searchError, "error");
      setGlobalSearchResults([]);
      setFilteredSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        addToast(`${t.fileUploadSuccess} ${data.tables.join(", ")}`, "success");
        fetchTables();
      } else {
        addToast(`${t.error} ${data.error}`, "error");
      }
    } catch (error) {
      addToast(t.uploadError + " " + error.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.types && e.dataTransfer.types.includes("Files")) {
      setDragCounter((prev) => prev + 1);
      setDragActive(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setDragCounter((prev) => {
      const newCount = prev - 1;
      if (newCount <= 0) {
        setDragActive(false);
        return 0;
      }
      return newCount;
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.types && e.dataTransfer.types.includes("Files")) {
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setDragCounter(0);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel" ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls") ||
        file.name.endsWith(".csv")
      ) {
        handleFileUpload(file);
      } else {
        addToast(t.invalidFileType, "error");
      }
    }
  };

  const handleExport = async (tableName, format = "xlsx") => {
    try {
      addToast(t.downloadingFile, "info");
      const response = await fetch(
        `${API_URL}/export/${tableName}?format=${format}`,
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${tableName}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        addToast(t.downloadComplete, "success");
      } else {
        throw new Error("Download failed");
      }
    } catch (error) {
      console.error(t.exportError, error);
      addToast(t.downloadFailed, "error");
    }
  };

  const handleExportSelected = async (format = "xlsx") => {
    if (selectedRows.size === 0) return;

    try {
      addToast(t.exportingSelected, "info");

      const selectedData = tableData.records.filter((record) =>
        selectedRows.has(record.id),
      );

      if (format === "csv") {
        const csvContent = [
          tableData.columns.join(","),
          ...selectedData.map((record) =>
            tableData.columns
              .map((col) => {
                const value = record.data[col] || "";

                return typeof value === "string" &&
                  (value.includes(",") || value.includes('"'))
                  ? `"${value.replace(/"/g, '""')}"`
                  : value;
              })
              .join(","),
          ),
        ].join("\n");

        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${selectedTable}_selected.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const wb = XLSX.utils.book_new();
        const wsData = [
          tableData.columns,
          ...selectedData.map((record) =>
            tableData.columns.map((col) => record.data[col] || ""),
          ),
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        XLSX.utils.book_append_sheet(wb, ws, "Selected Data");

        XLSX.writeFile(wb, `${selectedTable}_selected.xlsx`);
      }

      addToast(t.exportComplete, "success");
    } catch (error) {
      console.error(t.exportError, error);
      addToast(t.exportFailed, "error");
    }
  };

  const handleDelete = async (tableName) => {
    if (!confirm(`"${tableName}" ${t.confirmDelete}`)) return;

    try {
      const response = await fetch(`${API_URL}/delete/${tableName}`, {
        method: "DELETE",
      });
      if (response.ok) {
        addToast(t.tableDeletedSuccess, "success");
        fetchTables();
        if (selectedTable === tableName) {
          setSelectedTable(null);
          setTableData(null);
        }
      }
    } catch (error) {
      console.error(t.deleteError, error);
      addToast(t.deleteError, "error");
    }
  };

  const handlePageChange = async (newPage) => {
    if (
      selectedTable &&
      newPage >= 1 &&
      newPage <= tableData.pages &&
      newPage !== currentPage
    ) {
      setPageLoading(true);

      await new Promise((resolve) => setTimeout(resolve, 150));

      try {
        await fetchTableData(selectedTable, newPage, searchQuery);
      } finally {
        setPageLoading(false);
      }
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "tr" : "en");
  };

  const handleRowSelect = (recordId) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId);
    } else {
      newSelected.add(recordId);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === tableData.records.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(tableData.records.map((record) => record.id)));
    }
  };

  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm || !text) return text;

    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.toString().split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-yellow-200 text-yellow-900 px-1 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  const groupedSearchResults = filteredSearchResults.reduce((acc, result) => {
    if (!acc[result.table]) {
      acc[result.table] = [];
    }
    acc[result.table].push(result);
    return acc;
  }, {});

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ToastContainer />

      {dragActive && (
        <div className="fixed inset-0 bg-emerald-500 bg-opacity-30 z-[9999] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-8 rounded-xl shadow-2xl border-4 border-dashed border-emerald-500 transform scale-110 animate-bounce">
            <div className="text-center">
              <Upload className="h-16 w-16 mx-auto mb-4 text-emerald-600 animate-pulse" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {t.dragDropTitle}
              </h3>
              <p className="text-gray-600">{t.dragDropDescription}</p>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img
                src="/logo.png"
                onError={(e) => {
                  e.target.src = "/logo-example.png";
                }}
                alt="Logo"
                className="h-10 w-10 mr-3"
              />
              <h1 className="text-xl font-bold text-gray-900">{t.title}</h1>
            </div>

            <div className="hidden md:flex items-center">
              <div className="relative">
                <input
                  type="text"
                  value={globalSearchQuery}
                  onChange={(e) => {
                    setGlobalSearchQuery(e.target.value);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleGlobalSearch(e)}
                  placeholder={t.searchAllTables}
                  className="w-64 px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <button
                onClick={handleGlobalSearch}
                className="ml-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
              >
                {t.search}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleLanguage}
                className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                title="Change Language"
              >
                <Globe className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">
                  {language.toUpperCase()}
                </span>
              </button>

              <button
                onClick={() => setIsTerminalOpen(true)}
                className="flex items-center justify-center w-[120px] h-10 px-4 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                title={t.openTerminal}
              >
                <Terminal className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium whitespace-nowrap hidden sm:inline">
                  {t.terminal}
                </span>
              </button>

              <div
                className={`relative transition-all duration-200 ${
                  dragActive
                    ? "bg-emerald-50 border-emerald-300 scale-105 shadow-lg"
                    : "bg-emerald-600 hover:bg-emerald-700"
                } rounded-lg border-2 border-dashed ${
                  dragActive ? "border-emerald-400" : "border-transparent"
                }`}
              >
                <label className="flex items-center justify-center w-[140px] h-9 px-4 text-white cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2 select-none">
                  <Upload className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="text-sm font-medium whitespace-nowrap text-ellipsis">
                    {uploading
                      ? t.uploading
                      : dragActive
                        ? t.dragDropHere
                        : t.uploadExcel}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                {dragActive && (
                  <div className="absolute inset-0 bg-emerald-500 bg-opacity-20 rounded-lg pointer-events-none"></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="md:hidden mb-4">
          <div className="relative">
            <input
              type="text"
              value={globalSearchQuery}
              onChange={(e) => {
                setGlobalSearchQuery(e.target.value);
              }}
              onKeyPress={(e) => e.key === "Enter" && handleGlobalSearch(e)}
              placeholder={t.searchAllTables}
              className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <button
              onClick={handleGlobalSearch}
              className="absolute right-2 top-1.5 px-3 py-1 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700"
            >
              {t.search}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-80 bg-white rounded-xl shadow-md border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <FileSpreadsheet className="h-5 w-5 mr-2 text-primary-600" />
                {t.tables} ({tables.length})
              </h2>
            </div>
            <div className="p-2 max-h-96 lg:max-h-screen lg:overflow-y-auto">
              {tables.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">{t.noTables}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t.startByUploading}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {tables.map((table) => (
                    <div
                      key={table.id}
                      onClick={() => handleTableSelect(table.name)}
                      className={`p-2 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                        selectedTable === table.name
                          ? "bg-primary-50 border-primary-300 shadow-md"
                          : "hover:bg-gray-50 border-transparent hover:border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center min-w-0">
                          <FileSpreadsheet className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-gray-700 block truncate">
                              {table.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {table.record_count} {t.records}
                            </span>
                          </div>
                        </div>
                        {selectedTable === table.name && (
                          <div className="h-2 w-2 bg-primary-600 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 bg-white rounded-xl shadow-md border border-gray-200">
            {selectedTable ? (
              <div className="h-full flex flex-col">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Database className="h-6 w-6 mr-2 text-primary-600" />
                        {editingTableName ? (
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              if (
                                !newTableName.trim() ||
                                newTableName === selectedTable
                              ) {
                                setEditingTableName(false);
                                return;
                              }
                              try {
                                const res = await fetch(
                                  `${API_URL}/rename_table`,
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      old_name: selectedTable,
                                      new_name: newTableName,
                                    }),
                                  },
                                );
                                const data = await res.json();
                                if (res.ok) {
                                  addToast(
                                    language === "tr"
                                      ? "Tablo ismi güncellendi"
                                      : "Table renamed",
                                    "success",
                                  );
                                  setEditingTableName(false);
                                  setSelectedTable(newTableName);
                                  fetchTables();
                                } else {
                                  addToast(data.error || "Hata", "error");
                                }
                              } catch (e) {
                                addToast("Sunucu hatası", "error");
                              }
                            }}
                            className="flex items-center gap-2"
                          >
                            <input
                              className="text-xl font-bold text-gray-800 border-b border-gray-400 focus:outline-none focus:border-primary-500 bg-transparent w-40"
                              value={newTableName}
                              autoFocus
                              onChange={(e) => setNewTableName(e.target.value)}
                              onBlur={() => setEditingTableName(false)}
                            />
                            <button
                              type="submit"
                              className="text-emerald-600 text-sm font-medium px-2 py-1 hover:underline"
                            >
                              {language === "tr" ? "Kaydet" : "Save"}
                            </button>
                          </form>
                        ) : (
                          <h2
                            className="text-xl font-bold text-gray-800 flex items-center cursor-pointer hover:underline"
                            title={
                              language === "tr" ? "İsmi Değiştir" : "Rename"
                            }
                            onClick={() => {
                              setNewTableName(selectedTable);
                              setEditingTableName(true);
                            }}
                          >
                            {selectedTable}
                          </h2>
                        )}
                      </div>
                      {tableData && (
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm text-gray-500">
                            {tableData.total} {t.records} • {tableData.pages}{" "}
                            {t.pages}
                          </p>
                          {selectedRows.size > 0 && (
                            <p className="text-sm text-primary-600 font-medium">
                              {selectedRows.size} {t.selectedRows}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="flex">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSearch(e)
                          }
                          placeholder={t.searchInTable}
                          className="px-3 py-2 border border-gray-300 rounded-l-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-0"
                        />
                        <button
                          onClick={handleSearch}
                          className="px-3 py-2 bg-gray-600 text-white rounded-r-lg hover:bg-gray-700 transition-colors"
                        >
                          <Search className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <div
                          className={`flex gap-2 transition-all duration-200 ${selectedRows.size > 0 ? "opacity-100 visible" : "opacity-0 invisible"}`}
                        >
                          <div className="relative" ref={selectedDropdownRef}>
                            <button
                              onClick={() =>
                                setSelectedDropdownOpen(!selectedDropdownOpen)
                              }
                              className="flex items-center justify-center gap-2 min-w-[120px] h-10 px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors text-sm font-medium"
                              title={t.downloadFormat}
                            >
                              <Download className="h-4 w-4" />
                              <span className="hidden sm:inline whitespace-nowrap">
                                {t.downloadSelected}
                              </span>
                            </button>

                            {selectedDropdownOpen && (
                              <div className="absolute left-0 mt-2 py-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                <button
                                  onClick={() => {
                                    handleExportSelected("xlsx");
                                    setSelectedDropdownOpen(false);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                >
                                  <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                                  {t.downloadAsXLSX}
                                </button>
                                <button
                                  onClick={() => {
                                    handleExportSelected("csv");
                                    setSelectedDropdownOpen(false);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                >
                                  <Database className="h-4 w-4 mr-2 text-blue-600" />
                                  {t.downloadAsCSV}
                                </button>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => setSelectedRows(new Set())}
                            className="flex items-center justify-center gap-2 min-w-[100px] h-10 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors text-sm font-medium"
                            title={t.clearSelection}
                          >
                            <X className="h-4 w-4" />
                            <span className="hidden sm:inline whitespace-nowrap">
                              {t.clearSelection}
                            </span>
                          </button>
                        </div>

                        <div className="relative" ref={downloadDropdownRef}>
                          <button
                            onClick={() =>
                              setDownloadDropdownOpen(!downloadDropdownOpen)
                            }
                            className="flex items-center justify-center min-w-[40px] w-10 h-10 text-primary-600 hover:bg-primary-50 rounded-lg border border-primary-200 transition-colors"
                            title={t.downloadFormat}
                          >
                            <Download className="h-5 w-5" />
                          </button>

                          {downloadDropdownOpen && (
                            <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                              <button
                                onClick={() => {
                                  handleExport(selectedTable, "xlsx");
                                  setDownloadDropdownOpen(false);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                                {t.downloadAsXLSX}
                              </button>
                              <button
                                onClick={() => {
                                  handleExport(selectedTable, "csv");
                                  setDownloadDropdownOpen(false);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                <Database className="h-4 w-4 mr-2 text-blue-600" />
                                {t.downloadAsCSV}
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(selectedTable)}
                          className="flex items-center justify-center min-w-[40px] w-10 h-10 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                          title={t.deleteTable}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-6">
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">{t.loading}</p>
                      </div>
                    </div>
                  ) : tableData && tableData.records.length > 0 ? (
                    <>
                      <div className="overflow-x-auto table-scroll rounded-lg border border-gray-200">
                        <table className="w-full text-sm text-left table-fixed">
                          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                            <tr className="h-12 min-h-[48px] max-h-[48px]">
                              <th className="px-4 py-3 w-12 h-12">
                                <div className="flex items-center justify-center h-full">
                                  <ModernCheckbox
                                    checked={
                                      tableData.records.length > 0 &&
                                      selectedRows.size ===
                                        tableData.records.length
                                    }
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleSelectAll();
                                    }}
                                  />
                                </div>
                              </th>
                              {tableData.columns.map((col) => (
                                <th
                                  key={col}
                                  className="px-6 py-3 h-12 font-semibold whitespace-nowrap"
                                >
                                  <div className="flex items-center h-full">
                                    {col}
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {tableData.records.map((record, index) => (
                              <tr
                                key={record.id}
                                className={`h-12 min-h-[48px] max-h-[48px] ${
                                  selectedRows.has(record.id)
                                    ? "bg-primary-50"
                                    : index % 2 === 0
                                      ? "bg-white"
                                      : "bg-gray-50"
                                } hover:bg-primary-50 transition-colors`}
                              >
                                <td className="px-4 py-3 w-12 h-12">
                                  <div className="flex items-center justify-center h-full">
                                    <ModernCheckbox
                                      checked={selectedRows.has(record.id)}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleRowSelect(record.id);
                                      }}
                                    />
                                  </div>
                                </td>
                                {tableData.columns.map((col) => (
                                  <td
                                    key={col}
                                    className="px-6 py-3 h-12 text-gray-700 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingCell({ rowId: record.id, col });
                                      setRowEditData({ ...record.data });
                                    }}
                                  >
                                    <div className="flex items-center h-full">
                                      {editingCell &&
                                      editingCell.rowId === record.id &&
                                      editingCell.col === col ? (
                                        <form
                                          onSubmit={async (e) => {
                                            e.preventDefault();
                                            try {
                                              const res = await fetch(
                                                `${API_URL}/update_row`,
                                                {
                                                  method: "POST",
                                                  headers: {
                                                    "Content-Type":
                                                      "application/json",
                                                  },
                                                  body: JSON.stringify({
                                                    id: record.id,
                                                    table_name: selectedTable,
                                                    data: rowEditData,
                                                  }),
                                                },
                                              );
                                              const data = await res.json();
                                              if (res.ok) {
                                                addToast(
                                                  language === "tr"
                                                    ? "Satır güncellendi"
                                                    : "Row updated",
                                                  "success",
                                                );
                                                setEditingCell(null);
                                                fetchTableData(
                                                  selectedTable,
                                                  currentPage,
                                                  searchQuery,
                                                );
                                              } else {
                                                addToast(
                                                  data.error || "Hata",
                                                  "error",
                                                );
                                              }
                                            } catch (e) {
                                              addToast(
                                                "Sunucu hatası",
                                                "error",
                                              );
                                            }
                                          }}
                                          className="w-full"
                                        >
                                          <input
                                            className="border-b border-primary-500 focus:outline-none bg-white w-full px-1 py-0.5 text-sm"
                                            value={rowEditData[col] ?? ""}
                                            autoFocus
                                            onChange={(e) =>
                                              setRowEditData((d) => ({
                                                ...d,
                                                [col]: e.target.value,
                                              }))
                                            }
                                            onBlur={() => setEditingCell(null)}
                                          />
                                        </form>
                                      ) : (
                                        <div
                                          className="max-w-xs truncate w-full"
                                          title={record.data[col] || "-"}
                                        >
                                          {searchQuery
                                            ? highlightSearchTerm(
                                                record.data[col] || "-",
                                                searchQuery,
                                              )
                                            : record.data[col] || "-"}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                ))}
                                {/* Edit butonu kaldırıldı, hücreye tıklayınca inline edit açılır */}

                                {/* Satır Düzenle Modalı */}
                                {rowEditModal.open && (
                                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                                    <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-[90vw]">
                                      <h3 className="text-lg font-bold mb-2">
                                        {language === "tr"
                                          ? "Satırı Düzenle"
                                          : "Edit Row"}
                                      </h3>
                                      <form
                                        onSubmit={async (e) => {
                                          e.preventDefault();
                                          try {
                                            const res = await fetch(
                                              `${API_URL}/update_row`,
                                              {
                                                method: "POST",
                                                headers: {
                                                  "Content-Type":
                                                    "application/json",
                                                },
                                                body: JSON.stringify({
                                                  id: rowEditModal.row.id,
                                                  table_name: selectedTable,
                                                  data: rowEditData,
                                                }),
                                              },
                                            );
                                            const data = await res.json();
                                            if (res.ok) {
                                              addToast(
                                                language === "tr"
                                                  ? "Satır güncellendi"
                                                  : "Row updated",
                                                "success",
                                              );
                                              setRowEditModal({
                                                open: false,
                                                row: null,
                                              });
                                              fetchTableData(
                                                selectedTable,
                                                currentPage,
                                                searchQuery,
                                              );
                                            } else {
                                              addToast(
                                                data.error || "Hata",
                                                "error",
                                              );
                                            }
                                          } catch (e) {
                                            addToast("Sunucu hatası", "error");
                                          }
                                        }}
                                      >
                                        <div className="flex flex-col gap-3 mb-4">
                                          {tableData.columns.map((col) => (
                                            <div
                                              key={col}
                                              className="flex flex-col"
                                            >
                                              <label className="text-xs text-gray-600 mb-1">
                                                {col}
                                              </label>
                                              <input
                                                className="border border-gray-300 rounded px-2 py-1"
                                                value={rowEditData[col] ?? ""}
                                                onChange={(e) =>
                                                  setRowEditData((d) => ({
                                                    ...d,
                                                    [col]: e.target.value,
                                                  }))
                                                }
                                              />
                                            </div>
                                          ))}
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                          <button
                                            type="button"
                                            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                                            onClick={() =>
                                              setRowEditModal({
                                                open: false,
                                                row: null,
                                              })
                                            }
                                          >
                                            {language === "tr"
                                              ? "İptal"
                                              : "Cancel"}
                                          </button>
                                          <button
                                            type="submit"
                                            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                                          >
                                            {language === "tr"
                                              ? "Kaydet"
                                              : "Save"}
                                          </button>
                                        </div>
                                      </form>
                                    </div>
                                  </div>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {tableData.pages > 1 && (
                        <div className="flex items-center justify-between mt-6 p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <p className="text-sm text-gray-700">
                              {t.totalRecords}{" "}
                              <span className="font-medium">
                                {tableData.total}
                              </span>{" "}
                              {t.records}
                            </p>
                            <p className="text-sm text-primary-600 font-medium">
                              Page {currentPage} of {tableData.pages}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1 || pageLoading}
                              className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-gray-200 bg-white shadow-sm hover:shadow-md"
                            >
                              {pageLoading && currentPage > 1 ? (
                                <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-primary-600 rounded-full"></div>
                              ) : (
                                <ChevronLeft className="h-5 w-5" />
                              )}
                            </button>
                            <div className="flex items-center gap-1">
                              {Array.from(
                                { length: Math.min(5, tableData.pages) },
                                (_, i) => {
                                  let pageNum;
                                  if (tableData.pages <= 5) {
                                    pageNum = i + 1;
                                  } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                  } else if (
                                    currentPage >=
                                    tableData.pages - 2
                                  ) {
                                    pageNum = tableData.pages - 4 + i;
                                  } else {
                                    pageNum = currentPage - 2 + i;
                                  }

                                  return (
                                    <button
                                      key={pageNum}
                                      onClick={() => handlePageChange(pageNum)}
                                      disabled={pageLoading}
                                      className={`px-3 py-2 text-sm rounded-lg border transition-all duration-300 transform hover:scale-105 ${
                                        currentPage === pageNum
                                          ? "bg-primary-600 text-black border-primary-600 shadow-lg scale-110 font-bold"
                                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:shadow-md"
                                      }`}
                                    >
                                      {pageNum}
                                    </button>
                                  );
                                },
                              )}
                            </div>
                            <button
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={
                                currentPage === tableData.pages || pageLoading
                              }
                              className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-gray-200 bg-white shadow-sm hover:shadow-md"
                            >
                              {pageLoading && currentPage < tableData.pages ? (
                                <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-primary-600 rounded-full"></div>
                              ) : (
                                <ChevronRight className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">{t.loading}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Database className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    {t.selectTable}
                  </h3>
                  <p className="text-gray-500">{t.selectFromLeft}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {hasSearched && (
          <div
            ref={searchResultsRef}
            className="mt-6 bg-white rounded-xl shadow-md border border-gray-200 animate-fade-in"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <Search className="h-5 w-5 mr-2 text-primary-600" />
                  {t.searchResults} ({filteredSearchResults.length})
                </h3>
                <button
                  onClick={() => {
                    setGlobalSearchResults([]);
                    setFilteredSearchResults([]);
                    setResultsFilterQuery("");
                    setGlobalSearchQuery("");
                    setHasSearched(false);
                    setLastSearchTerm("");
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {hasSearched && (
                <div className="relative">
                  <input
                    type="text"
                    value={resultsFilterQuery}
                    onChange={(e) => {
                      setResultsFilterQuery(e.target.value);
                    }}
                    placeholder={t.filterResults}
                    className={`w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${filterLoading ? "pr-10" : ""}`}
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  {filterLoading && (
                    <div className="absolute right-3 top-2.5">
                      <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-primary-600 rounded-full"></div>
                    </div>
                  )}
                  {resultsFilterQuery && (
                    <button
                      onClick={() => {
                        setResultsFilterQuery("");
                      }}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="p-4">
              {searchLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">{t.searching}</p>
                  </div>
                </div>
              ) : filterLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">{t.filtering}</p>
                  </div>
                </div>
              ) : Object.keys(groupedSearchResults).length > 0 ? (
                Object.entries(groupedSearchResults).map(
                  ([tableName, results], tableIndex) => (
                    <div key={tableName} className="mb-6 last:mb-0">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                        <div className="flex items-center">
                          <FileSpreadsheet className="h-5 w-5 text-primary-600 mr-2" />
                          <h4 className="text-lg font-semibold text-gray-800">
                            {tableName}
                          </h4>
                          <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                            {results.length} {t.resultsInTable}
                          </span>
                        </div>
                        <button
                          onClick={() => handleTableSelect(tableName)}
                          className="group flex items-center gap-2 px-4 py-2 bg-white text-primary-600 border-2 border-primary-600 rounded-lg"
                        >
                          <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          <span>{t.openTable}</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border border-gray-200 rounded-lg">
                          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                              {results.length > 0 &&
                                Object.keys(results[0].data).map((key) => (
                                  <th
                                    key={key}
                                    className="px-4 py-3 font-semibold border-b border-gray-200 whitespace-nowrap"
                                  >
                                    {key}
                                  </th>
                                ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {results.map((result, index) => (
                              <tr
                                key={index}
                                className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-primary-50 transition-colors`}
                              >
                                {Object.entries(result.data).map(
                                  ([key, value]) => (
                                    <td
                                      key={key}
                                      className="px-4 py-3 text-gray-700 border-r border-gray-200 last:border-r-0"
                                    >
                                      <div
                                        className="max-w-xs truncate"
                                        title={value || "-"}
                                      >
                                        {resultsFilterQuery
                                          ? highlightSearchTerm(
                                              value || "-",
                                              resultsFilterQuery,
                                            )
                                          : value || "-"}
                                      </div>
                                    </td>
                                  ),
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {tableIndex <
                        Object.keys(groupedSearchResults).length - 1 && (
                        <div className="mt-6 border-t-2 border-dashed border-gray-300"></div>
                      )}
                    </div>
                  ),
                )
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium mb-2">
                    {t.noSearchResults}
                  </p>
                  <p className="text-sm mb-1">
                    {t.searchPerformed}{" "}
                    <span className="font-medium">"{lastSearchTerm}"</span>
                  </p>
                  <p className="text-sm">{t.tryDifferentSearch}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <WebTerminal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
      />
    </div>
  );
}
