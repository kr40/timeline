-- Boy/Girl poll and Guess-the-Birthday now require a name in the app.
-- Clean up any pre-existing blank/missing names, then enforce it going forward.

delete from guesses where trim(guesser_name) = '';
delete from votes where voter_name is null or trim(voter_name) = '';

alter table votes alter column voter_name set not null;
alter table votes add constraint votes_voter_name_not_blank check (length(trim(voter_name)) > 0);
alter table guesses add constraint guesses_guesser_name_not_blank check (length(trim(guesser_name)) > 0);
