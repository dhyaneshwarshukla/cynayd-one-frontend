"use client";

import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '../common/Button';
import { ProgressBar } from '../common/ProgressBar';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, onProgress: (progress: number) => void, onStatus: (status: any) => void) => Promise<{
    results: {
      total: number;
      success: number;
      failed: number;
      errors: Array<{ row: number; email?: string; error: string }>;
      created: Array<{ email: string; name: string }>;
    };
    message: string;
  }>;
  onDownloadTemplate: () => void;
  isSuperAdmin?: boolean;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  onDownloadTemplate,
  isSuperAdmin = false,
}) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    total: number;
    success: number;
    failed: number;
    errors: Array<{ row: number; email?: string; error: string }>;
    created: Array<{ email: string; name: string }>;
  } | null>(null);
  const [userStatuses, setUserStatuses] = useState<Array<{
    userNumber: number;
    email: string;
    name: string;
    status: string;
    message: string;
  }>>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setResults(null);
      setUserStatuses([]);
    }
  };

  const handleUpload = async () => {
    if (!csvFile) return;

    try {
      setUploading(true);
      setProcessing(false);
      setProgress(0);
      setUserStatuses([]);
      setResults(null);

      const controller = new AbortController();
      setAbortController(controller);

      const result = await onUpload(
        csvFile,
        (prog) => {
          setProgress(prog);
          if (prog >= 100) {
            setUploading(false);
            setProcessing(true);
          }
        },
        (status) => {
          if (status.type === 'user_status' && status.userNumber && status.email) {
            setUserStatuses(prev => {
              const existing = prev.findIndex(s => s.userNumber === status.userNumber);
              if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = {
                  userNumber: status.userNumber,
                  email: status.email || '',
                  name: status.name || status.email || '',
                  status: status.status || 'processing',
                  message: status.message || '',
                };
                return updated;
              } else {
                return [...prev, {
                  userNumber: status.userNumber,
                  email: status.email,
                  name: status.name || status.email || '',
                  status: status.status || 'processing',
                  message: status.message || '',
                }];
              }
            });
          }
        }
      );

      setResults(result.results);
      setProcessing(false);
      setAbortController(null);
    } catch (error: any) {
      if (error.message !== 'Upload aborted') {
        console.error('CSV upload error:', error);
      }
      setUploading(false);
      setProcessing(false);
      setAbortController(null);
    }
  };

  const handleClose = () => {
    if (uploading || processing) {
      if (!window.confirm('Are you sure you want to cancel? The current operation will be stopped.')) {
        return;
      }
      if (abortController) {
        abortController.abort();
      }
    }
    setCsvFile(null);
    setUploading(false);
    setProcessing(false);
    setProgress(0);
    setResults(null);
    setUserStatuses([]);
    setAbortController(null);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
                    Upload Users via CSV
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={uploading || processing}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    aria-label="Close modal"
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {!results ? (
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-900 mb-2">CSV Format Requirements</h4>
                          <p className="text-sm text-blue-800 mb-2">Your CSV file should include:</p>
                        </div>
                        <Button onClick={onDownloadTemplate} size="sm" className="ml-4">
                          Download Template
                        </Button>
                      </div>
                      <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                        <li><strong>email</strong> (required) - User email address</li>
                        <li><strong>name</strong> (required) - User full name</li>
                        <li><strong>role</strong> (optional) - USER, ADMIN{isSuperAdmin ? ', or SUPER_ADMIN' : ''}</li>
                        <li><strong>password</strong> (optional) - Auto-generated if not provided</li>
                        <li><strong>image</strong> (optional) - Profile image URL</li>
                        <li><strong>jobTitle</strong> (optional) - User job title</li>
                        <li><strong>phoneNumber</strong> (optional) - User phone number</li>
                      </ul>
                    </div>

                    <div>
                      <label htmlFor="csv-file" className="block text-sm font-medium text-gray-700 mb-2">
                        Select CSV File
                      </label>
                      <input
                        id="csv-file"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Select CSV file"
                      />
                      {csvFile && (
                        <p className="mt-2 text-sm text-gray-600">
                          Selected: <strong>{csvFile.name}</strong> ({(csvFile.size / 1024).toFixed(2)} KB)
                        </p>
                      )}
                    </div>

                    {(uploading || processing) && (
                      <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 font-semibold">
                            {uploading ? 'Upload Progress' : 'Processing Progress'}
                          </span>
                          <span className="text-blue-700 font-bold">
                            {processing ? 'Processing...' : `${progress}%`}
                          </span>
                        </div>
                        <ProgressBar value={processing ? 100 : progress} />
                      </div>
                    )}

                    {processing && userStatuses.length > 0 && (
                      <div className="space-y-2 p-4 bg-gray-50 border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                        <h4 className="font-semibold text-gray-900 mb-3">User Processing Status</h4>
                        <div className="space-y-2">
                          {userStatuses.map((status, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-md border ${
                                status.status === 'email_sent'
                                  ? 'bg-green-50 border-green-200'
                                  : status.status === 'created'
                                  ? 'bg-blue-50 border-blue-200'
                                  : status.status === 'failed' || status.status === 'error'
                                  ? 'bg-red-50 border-red-200'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium text-gray-900">
                                    User {status.userNumber}: {status.name} ({status.email})
                                  </span>
                                  <p className="text-sm text-gray-600 mt-1">{status.message}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={uploading || processing}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleUpload}
                        disabled={!csvFile || uploading || processing}
                        loading={uploading || processing}
                        className="flex-1"
                      >
                        Upload CSV
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-2">Upload Complete</h4>
                      <p className="text-sm text-green-800">
                        Successfully created {results.success} of {results.total} users.
                        {results.failed > 0 && ` ${results.failed} failed.`}
                      </p>
                    </div>

                    {results.errors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                        <h4 className="font-semibold text-red-900 mb-2">Errors</h4>
                        <ul className="text-sm text-red-800 space-y-1">
                          {results.errors.map((error, idx) => (
                            <li key={idx}>
                              Row {error.row}: {error.email} - {error.error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <Button
                        type="button"
                        onClick={handleClose}
                        className="flex-1"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

