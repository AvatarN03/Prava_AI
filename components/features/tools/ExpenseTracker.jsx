"use client";
import React, { useEffect, useState } from "react";

import { DollarSign, Plus, Trash2, Globe } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

import { useAuth } from "@/context/useAuth";
import { useExpense } from "@/hooks/useExpense";
import { toDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function ExpenseTracker() {
  const { profile } = useAuth();
  const { getExpenses, addExpense, deleteExpense, getBuckets, createBucket, loading } = useExpense();

  const [expenses, setExpenses] = useState([]);
  const [buckets, setBuckets] = useState([]);
  const [newBucketTitle, setNewBucketTitle] = useState("");
  const [exchangeRates, setExchangeRates] = useState({});
  const [loadingRates, setLoadingRates] = useState(true);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [newExpense, setNewExpense] = useState({
    title: "",
    bucketTitle: "General",
    amount: "",
    currency: "INR",
    note: "",
  });
  const [globalCurrency, setGlobalCurrency] = useState("INR");

  const currencies = ["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD", "CHF"];

  const currencySymbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    JPY: "¥",
    AUD: "A$",
    CAD: "C$",
    CHF: "Fr",
  };

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await axios.get("/api/tools");
        setExchangeRates(res.data || {});
      } catch (error) {
        console.error("Failed to fetch currency rates", error);
      } finally {
        setLoadingRates(false);
      }
    };

    fetchRates();
  }, []);

  useEffect(() => {
    const fetchUserExpenseData = async () => {
      if (!profile?.uid) {
        setExpenses([]);
        setBuckets([]);
        setIsBootstrapping(false);
        return;
      }

      setIsBootstrapping(true);
      const [bucketRes, expenseRes] = await Promise.all([
        getBuckets({ userId: profile.uid }),
        getExpenses({ userId: profile.uid }),
      ]);

      if (bucketRes.success) {
        const list = bucketRes.data || [];
        setBuckets(list);
      }

      if (expenseRes.success) {
        setExpenses(expenseRes.data || []);
      }

      if (!bucketRes.success || !expenseRes.success) {
        toast.error(bucketRes.error || expenseRes.error || "Failed to load expenses");
      }

      setIsBootstrapping(false);
    };

    fetchUserExpenseData();
  }, [profile?.uid]);

  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    if (
      !exchangeRates ||
      Object.keys(exchangeRates).length === 0 ||
      !exchangeRates[fromCurrency] ||
      !exchangeRates[toCurrency]
    ) {
      return amount; // fallback if rates not ready
    }

    // All rates are relative to EUR
    // Convert `fromCurrency -> EUR -> toCurrency`
    const amountInEUR = amount / exchangeRates[fromCurrency]; // convert to EUR first
    const converted = amountInEUR * exchangeRates[toCurrency]; // then to target
    return converted;
  };


  const handleCreateBucket = async () => {
    if (!profile?.uid) {
      toast.error("Please sign in to manage expenses");
      return;
    }

    if (!newBucketTitle.trim()) {
      toast.error("Please enter a bucket title");
      return;
    }

    const res = await createBucket({ userId: profile.uid, title: newBucketTitle });
    if (!res.success) {
      toast.error(res.error || "Failed to create bucket");
      return;
    }

    setBuckets((prev) => {
      const exists = prev.some((bucket) => bucket.titleLower === res.data.titleLower);
      return exists ? prev : [...prev, res.data].sort((a, b) => a.title.localeCompare(b.title));
    });

    setNewExpense((prev) => ({ ...prev, bucketTitle: res.data.title }));
    setNewBucketTitle("");
    toast.success("Bucket created");
  };

  const handleAddExpense = async () => {
    if (!profile?.uid) {
      toast.error("Please sign in to add expenses");
      return;
    }

    const payload = {
      ...newExpense,
      amount: parseFloat(newExpense.amount || 0),
      currency: newExpense.currency || globalCurrency,
      bucketTitle: newExpense.bucketTitle || "General",
    };

    const res = await addExpense({ userId: profile.uid, expense: payload });
    if (!res.success) {
      toast.error(res.error || "Failed to add expense");
      return;
    }

    setExpenses((prev) => [res.data, ...prev]);
    setNewExpense({
      title: "",
      bucketTitle: payload.bucketTitle,
      amount: "",
      currency: globalCurrency,
      note: "",
    });

    if (!buckets.some((bucket) => bucket.title?.toLowerCase() === payload.bucketTitle.toLowerCase())) {
      setBuckets((prev) => [
        ...prev,
        { title: payload.bucketTitle, titleLower: payload.bucketTitle.toLowerCase() },
      ]);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!profile?.uid) return;

    const res = await deleteExpense({ userId: profile.uid, expenseId: id });
    if (!res.success) {
      toast.error(res.error || "Failed to delete expense");
      return;
    }

    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
  };

  // ✅ Wait for rates to load
  if (loadingRates || isBootstrapping) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-600 dark:text-gray-300">
        Loading expenses...
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, exp) => {
    const convertedAmount = convertCurrency(
      exp.amount,
      exp.currency,
      globalCurrency
    );
    return sum + convertedAmount;
  }, 0);

  const getCategoryIcon = (category) => {
    const lower = String(category || "").toLowerCase();
    if (lower.includes("food") || lower.includes("restaurant")) return "🍽️";
    if (lower.includes("hotel") || lower.includes("accommodation")) return "🏨";
    if (lower.includes("transport") || lower.includes("flight")) return "✈️";
    if (lower.includes("activity") || lower.includes("tour")) return "🎭";
    if (lower.includes("shopping")) return "🛍️";
    return "💰";
  };

  return (
    <div className="space-y-6">
      <div className="rounded-md p-3 md:p-6 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-colors">
        <div className="flex justify-between items-start md:items-center mb-6 w-full flex-col md:flex-row gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Expense Tracker
          </h2>

          <div className="flex items-center md:justify-end justify-between gap-4">
            {/* 🌍 Global Currency Selector */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-900 rounded-lg px-4 py-2 border border-gray-300 dark:border-slate-700">
              <Globe size={20} className="text-blue-500" />
              <select
                value={globalCurrency}
                onChange={(e) => {
                  setGlobalCurrency(e.target.value);
                  setNewExpense({ ...newExpense, currency: e.target.value });
                }}
                className="bg-transparent cursor-pointer text-gray-900 dark:text-white focus:outline-none font-medium"
              >
                {currencies.map((curr) => (
                  <option
                    key={curr}
                    value={curr}
                    className="bg-white dark:bg-slate-800"
                  >
                    {curr}
                  </option>
                ))}
              </select>
            </div>

            {/* 💰 Total Display */}
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Total Expenses
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {currencySymbols[globalCurrency]} {totalExpenses.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* ➕ Add New Expense */}
        <div className="bg-gray-100 dark:bg-slate-900 rounded-lg p-2 md:p-4 mb-6 border border-gray-300 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Create Bucket
          </h3>
          <div className="flex flex-col md:flex-row justify-between items-center  gap-2">
            <input
              type="text"
              placeholder="Bucket title (e.g., Food, Hotel)"
              value={newBucketTitle}
              onChange={(e) => setNewBucketTitle(e.target.value)}
              className="bg-white flex flex-1 w-full  dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            />
            <Button
            className={"ml-auto"}
              onClick={handleCreateBucket}
             
            >
              <Plus size={20} />
              Add Bucket
            </Button>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-slate-900 rounded-lg p-2 md:p-4 mb-6 border border-gray-300 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Add New Expense
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <input
              type="text"
              placeholder="Expense title"
              value={newExpense.title}
              onChange={(e) =>
                setNewExpense({ ...newExpense, title: e.target.value })
              }
              className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            />
            <select
              value={newExpense.bucketTitle}
              onChange={(e) => setNewExpense({ ...newExpense, bucketTitle: e.target.value })}
              className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="General">General</option>
              {buckets.map((bucket) => (
                <option key={bucket.id || bucket.titleLower || bucket.title} value={bucket.title}>
                  {bucket.title}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Amount"
              value={newExpense.amount}
              onChange={(e) =>
                setNewExpense({ ...newExpense, amount: e.target.value })
              }
              onKeyDown={(e) => e.key === "Enter" && handleAddExpense()}
              className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            />
            <select
              value={newExpense.currency}
              onChange={(e) => setNewExpense({ ...newExpense, currency: e.target.value })}
              className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            >
              {currencies.map((curr) => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
            <button
              onClick={handleAddExpense}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Add Expense
            </button>
          </div>
        </div>

        {/* 📜 Expenses List */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Recent Expenses
          </h3>
          {expenses.length === 0 ? (
            <div className="bg-gray-100 dark:bg-slate-900 rounded-lg p-8 text-center border border-gray-300 dark:border-slate-700">
              <DollarSign
                className="mx-auto mb-3 text-gray-400 dark:text-slate-600"
                size={48}
              />
              <p className="text-gray-500 dark:text-slate-400">
                No expenses yet. Add your first expense to start tracking!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => {
                const convertedAmount = convertCurrency(
                  expense.amount,
                  expense.currency,
                  globalCurrency
                );
                return (
                  <div
                    key={expense.id}
                    className="bg-gray-100 dark:bg-slate-900 rounded-lg p-2 md:p-4 flex flex-col md:flex-row items-center justify-between border border-gray-300 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-between md:justify-start w-full md:w-auto gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-2xl">
                        {getCategoryIcon(expense.category)}
                      </div>
                      <div>
                        <p className="font-semibold text-lg text-gray-900 dark:text-white">
                          {expense.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                          {toDate(expense.createdAt)} | {expense.bucketTitle || "General"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center md:justify-end justify-between w-full md:w-auto mt-2 p-2 bg-gray-200 dark:bg-slate-800 rounded-md gap-4">
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {currencySymbols[globalCurrency]}{" "}
                          {convertedAmount.toFixed(2)}
                        </p>
                        {expense.currency !== globalCurrency && (
                          <p className="text-xs text-gray-500 dark:text-slate-500">
                            ({currencySymbols[expense.currency]}{" "}
                            {expense.amount.toFixed(2)} {expense.currency})
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-500 hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                        aria-label="Delete expense"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 📊 Summary Statistics */}
        {expenses.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-100 dark:bg-slate-900 rounded-lg p-4 border border-gray-300 dark:border-slate-700">
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                Average Expense
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {currencySymbols[globalCurrency]}{" "}
                {(totalExpenses / expenses.length).toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-slate-900 rounded-lg p-4 border border-gray-300 dark:border-slate-700">
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                Total Transactions
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {expenses.length}
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-slate-900 rounded-lg p-4 border border-gray-300 dark:border-slate-700">
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                Highest Expense
              </p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {currencySymbols[globalCurrency]}{" "}
                {Math.max(
                  ...expenses.map((e) =>
                    convertCurrency(e.amount, e.currency, globalCurrency)
                  )
                ).toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
