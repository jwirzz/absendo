-- Feedback may only be written by the server-side Edge Function.
drop policy if exists "Allow everyone to insert feedback" on public.feedback;

revoke all privileges on table public.feedback from anon, authenticated;

alter table public.feedback
    add constraint feedback_name_valid
        check (name is not null and char_length(btrim(name)) between 1 and 80) not valid,
    add constraint feedback_email_valid
        check (email is not null and char_length(btrim(email)) between 3 and 120) not valid,
    add constraint feedback_reason_valid
        check (grund in ('feature', 'bug', 'hilfe', 'sonstiges')) not valid,
    add constraint feedback_message_valid
        check (nachricht is not null and char_length(btrim(nachricht)) between 10 and 1200) not valid;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.feedback_rate_limits (
    fingerprint text primary key,
    window_started_at timestamptz not null default now(),
    request_count integer not null default 0 check (request_count >= 0)
);

create index if not exists feedback_rate_limits_window_idx
    on private.feedback_rate_limits (window_started_at);

revoke all privileges on table private.feedback_rate_limits from public, anon, authenticated;

create or replace function public.consume_feedback_rate_limit(p_fingerprint text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
    current_entry private.feedback_rate_limits%rowtype;
begin
    if p_fingerprint is null or char_length(p_fingerprint) <> 64 then
        return false;
    end if;

    delete from private.feedback_rate_limits
    where window_started_at < now() - interval '7 days';

    insert into private.feedback_rate_limits (fingerprint)
    values (p_fingerprint)
    on conflict (fingerprint) do nothing;

    select *
    into current_entry
    from private.feedback_rate_limits
    where fingerprint = p_fingerprint
    for update;

    if current_entry.window_started_at <= now() - interval '15 minutes' then
        update private.feedback_rate_limits
        set window_started_at = now(), request_count = 1
        where fingerprint = p_fingerprint;
        return true;
    end if;

    if current_entry.request_count >= 5 then
        return false;
    end if;

    update private.feedback_rate_limits
    set request_count = request_count + 1
    where fingerprint = p_fingerprint;
    return true;
end;
$$;

revoke all on function public.consume_feedback_rate_limit(text) from public, anon, authenticated;
grant execute on function public.consume_feedback_rate_limit(text) to service_role;

-- Remove unused functions that refer to a table which does not exist.
drop trigger if exists pdf_files_insert_trigger on public.pdf_files;
drop function if exists public.add_generated_absence();
drop function if exists public.count_generated_absences();
drop function if exists public.insert_generated_absence();

-- Owners may update their own rows and files; the client re-encrypts legacy data in place.
-- WITH CHECK keeps rows and files from being moved to another user.
drop policy if exists "Users can update their own pdf files" on public.pdf_files;
create policy "Users can update their own pdf files"
    on public.pdf_files
    for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update files in own folder" on storage.objects;
create policy "Users can update files in own folder"
    on storage.objects
    for update
    to authenticated
    using (bucket_id = 'pdf-files' and (select auth.uid())::text = (storage.foldername(name))[1])
    with check (bucket_id = 'pdf-files' and (select auth.uid())::text = (storage.foldername(name))[1]);

-- Nothing reads these tables before sign-in.
revoke all privileges on table public.pdf_files, public.profiles from anon;

-- Trigger-only function; must not be callable via /rest/v1/rpc.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Clients still running the old bundle can't read v2 profiles and would overwrite them
-- with empty legacy ciphertext. Reject any write that downgrades a v2 profile.
create or replace function public.prevent_profile_encryption_downgrade()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if old.encrypted_data like 'absendo:v2:%'
       and new.encrypted_data is distinct from old.encrypted_data
       and coalesce(new.encrypted_data, '') not like 'absendo:v2:%' then
        raise exception 'Profile encryption downgrade rejected' using errcode = '42501';
    end if;
    return new;
end;
$$;

revoke execute on function public.prevent_profile_encryption_downgrade() from public, anon, authenticated;

drop trigger if exists profiles_prevent_encryption_downgrade on public.profiles;
create trigger profiles_prevent_encryption_downgrade
    before update on public.profiles
    for each row execute function public.prevent_profile_encryption_downgrade();
