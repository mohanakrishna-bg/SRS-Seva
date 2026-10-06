/**
 * CustomerForm (Legacy alias for DevoteeForm)
 * Retained for backwards compatibility across existing consumers and tests.
 * Canonical implementation lives in ./DevoteeForm.
 */
import DevoteeForm from './DevoteeForm';
import type { DevoteeFormProps, DevoteeFormData } from './DevoteeForm';

export type CustomerFormProps = DevoteeFormProps;
export type { DevoteeFormData };
export default DevoteeForm;
