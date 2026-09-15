-- Remove the enquiry row created while verifying that the public contact
-- form writes to Supabase. Test data should not sit in a table someone will
-- later read as real enquiries.
delete from enquiries where email = 'verify@example.com' and organisation = 'Build Check';
