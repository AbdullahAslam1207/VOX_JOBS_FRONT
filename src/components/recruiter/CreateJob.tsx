import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createRecruiterJob, getRecruiterJobSchema, updateRecruiterJob, RecruiterJobSchemaField, JobApi } from '../../api';

type JobState = {
  job?: JobApi;
};

export default function CreateJob() {
  const navigate = useNavigate();
  const location = useLocation();
  const editingJob = (location.state as JobState | null | undefined)?.job;
  const [schema, setSchema] = useState<RecruiterJobSchemaField[]>([]);
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSchema = async () => {
      try {
        setLoading(true);
        const fields = await getRecruiterJobSchema();
        setSchema(fields);
      } catch (err: any) {
        setError(err?.message || 'Unable to load job schema');
      } finally {
        setLoading(false);
      }
    };

    void loadSchema();
  }, []);

  useEffect(() => {
    if (!schema.length) return;

    const initialValues: Record<string, any> = {};
    schema.forEach((field) => {
      if (editingJob) {
        initialValues[field.name] =
          editingJob[field.name as keyof JobApi] ??
          (field.name === 'job_description' ? editingJob.job_description || editingJob.description || '' : '');
      } else if (field.field_type === 'checkbox') {
        initialValues[field.name] = field.default === 'true';
      } else {
        initialValues[field.name] = field.default ?? '';
      }
    });

    setValues(initialValues);
  }, [schema, editingJob]);

  const title = useMemo(() => (editingJob ? 'Edit Job' : 'Create Job'), [editingJob]);

  function setField(name: string, value: any) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit() {
    try {
      setSaving(true);
      setError('');

      const payload: Record<string, any> = {};
      schema.forEach((field) => {
        const currentValue = values[field.name];
        if (field.field_type === 'checkbox') {
          payload[field.name] = Boolean(currentValue);
          return;
        }

        if (typeof currentValue === 'string') {
          const trimmed = currentValue.trim();
          if (trimmed || field.required) {
            payload[field.name] = trimmed;
          }
          return;
        }

        if (currentValue !== undefined && currentValue !== null) {
          payload[field.name] = currentValue;
        }
      });

      if (editingJob) {
        await updateRecruiterJob(Number(editingJob.id), payload);
      } else {
        await createRecruiterJob(payload);
      }

      navigate('/recruiter');
    } catch (err: any) {
      setError(err?.message || 'Unable to save job');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-white/70">Loading job form…</div>;
  }

  return (
    <div className="p-6 md:p-8 text-white/90">
      <div className="max-w-4xl">
        <p className="text-emerald-300 uppercase tracking-[0.22em] text-xs mb-2">Recruiter Jobs</p>
        <h1 className="text-3xl md:text-4xl font-semibold mb-2">{title}</h1>
        <p className="text-white/60 mb-6">Fields are generated from the current Job schema. Title and description are required, everything else follows the backend schema.</p>

        {error && <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">{error}</div>}

        <div className="grid gap-4 md:grid-cols-2">
          {schema.map((field) => (
            <FieldInput key={field.name} field={field} value={values[field.name]} onChange={(value) => setField(field.name, value)} />
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={handleSubmit} className="px-5 py-3 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50" disabled={saving}>
            {saving ? 'Saving…' : editingJob ? 'Update Job' : 'Create Job'}
          </button>
          <button onClick={() => navigate('/recruiter')} className="px-5 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/15 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: RecruiterJobSchemaField; value: any; onChange: (value: any) => void }) {
  return (
    <div className={field.field_type === 'textarea' ? 'md:col-span-2' : ''}>
      <label className="block text-sm font-medium text-white/85 mb-2">
        {field.label}
        {field.required ? <span className="text-emerald-300"> *</span> : null}
      </label>
      {field.field_type === 'textarea' ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/35 outline-none focus:border-emerald-400/60"
          placeholder={field.label}
        />
      ) : field.field_type === 'checkbox' ? (
        <label className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          <span className="text-sm text-white/80">{field.label}</span>
        </label>
      ) : (
        <input
          type={field.field_type === 'number' ? 'number' : 'text'}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/35 outline-none focus:border-emerald-400/60"
          placeholder={field.label}
        />
      )}
    </div>
  );
}
