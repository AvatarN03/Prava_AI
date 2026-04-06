"use client";

import { useState } from "react";

import { addExpenseAction } from "@/actions/expense/addExpense";
import { createExpenseBucketAction } from "@/actions/expense/createBucket";
import { deleteExpenseAction } from "@/actions/expense/deleteExpense";
import { getExpenseBucketsAction } from "@/actions/expense/getBuckets";
import { getExpensesAction } from "@/actions/expense/getExpenses";

export const useExpense = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const withState = async (fn) => {
    setLoading(true);
    setError("");
    try {
      const res = await fn();
      if (!res?.success) {
        throw new Error(res?.error || "Something went wrong");
      }
      return res;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const getExpenses = ({ userId }) => withState(() => getExpensesAction({ userId }));
  const addExpense = ({ userId, expense }) => withState(() => addExpenseAction({ userId, expense }));
  const deleteExpense = ({ userId, expenseId }) => withState(() => deleteExpenseAction({ userId, expenseId }));

  const getBuckets = ({ userId }) => withState(() => getExpenseBucketsAction({ userId }));
  const createBucket = ({ userId, title }) => withState(() => createExpenseBucketAction({ userId, title }));

  return {
    getExpenses,
    addExpense,
    deleteExpense,
    getBuckets,
    createBucket,
    loading,
    error,
  };
};
