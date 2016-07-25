class User

    attr_accessor :id
    attr_accessor :email
    attr_accessor :password
    attr_accessor :api_key
    attr_accessor :team
    attr_accessor :firstname
    attr_accessor :lastname
    attr_accessor :authority
    attr_accessor :password_reset_key
    attr_accessor :password_reset_sent_at
    attr_accessor :created_at
    attr_accessor :phone
    ### new
    attr_accessor :email_verified
    attr_accessor :phone_verified
    attr_accessor :staged
    attr_accessor :active
    attr_accessor :approved
    attr_accessor :approved_by_id
    attr_accessor :approved_at
    attr_accessor :suspended
    attr_accessor :suspended_at
    attr_accessor :suspended_till
    attr_accessor :blocked
    attr_accessor :last_posted_at
    attr_accessor :last_emailed_at
    attr_accessor :previous_visit_at
    attr_accessor :first_seen_at
    attr_accessor :registration_ip_address

    attr_accessor :errors

    ADMIN = 'admin'.freeze

    def self.max_password_length
        200
    end

    def self.new_from_params(params)
        user = User.new
        params.symbolize_keys!
        params.each { |k, v| user.send("#{k}=", v) }
        user
    end

    def self.suggest_firstname(email)
        return "" if email.blank?
        email[/\A[^@]+/].tr(".", " ").titleize
    end

    def find_by_email
        ensure_password_is_hashed
        if to_hash[:email].include?('@')
            find_by_password
        end
    end

    def save
        ensure_password_is_hashed
        Api::Accounts.new.save(to_hash)
    end

    def update
        Api::Accounts.new.update(update_hash)
    end

    def reset
        Api::Accounts.new.reset(to_hash)
    end

    def repassword
        Api::Accounts.new.repassword(update_hash)
    end

    def email_available?
        find_by_email
    rescue Nilavu::NotFound => e
        false
    end

    def password=(password)
        unless password.blank?
            @raw_password = password
        end
    end

    # Indicate that this is NOT a passwordless account for the purposes of validation
    def password_required!
        @password_required = true
    end

    def password_required?
        !!@password_required
    end

    def has_password?
        password_hash.present?
    end

    def confirm_password?(password)
        return false unless password && @raw_password
        password == password_hash(@raw_password)
    end

    def email_confirmed?
        true
    end

    def ensure_password_is_hashed
        if @raw_password
            self.password = hash_password(@raw_password)
        end
    end

    def hash_password(password)
        raise "password is too long" if password.size > User.max_password_length
        Base64.strict_encode64(password)
    end

    def password_hash(password)
        Base64.strict_decode64(password)
    end

    def admin?
        if authority
            return authority.include?("admin")
        end
        false
    end

    def staff?
        admin? && Rails.env.development?
    end

    def org_id
        team.id if team
    end

    def to_hash
        {:email => @email,
            :api_key => @api_key,
            :password => @raw_password,
            :username => User.suggest_firstname(@email),
            :first_name =>@firstname,
            :last_name => @lastname,
            :phone => @phone,
            #phone_verified: @phone_verified,
            #email_verified: @email_verified,
            #staged: @staged,
            #active: @active,
            #approved: @approved,
            #approved_by_id: @approved_by_id,
            #approved_at: @approved_at,
            #suspended: @suspended,
            #suspended_at: @suspended_at.
            #suspended_till: @suspended_till,
            #blocked: @blocked,
            #last_posted_at: @last_posted_at,
            #last_emailed_at: @last_emailed_at,
            #previous_visit_at: @previous_visit_at,
            #first_seen_at: @first_seen_at,
            #registration_ip_address: @registration_ip_address
            :createdAt =>@created_at
        }
    end

    def update_hash
        {:email => @email,
            :api_key => @api_key,
            :password => ensure_password_is_hashed,
            :username => User.suggest_firstname(@email),
            :first_name => @firstname,
            :last_name => @lastname,
            :password_reset_key => @password_reset_key,
            :phone => @phone,
            :createdAt =>@created_at
        }
    end

    private

    def parms_using_password
        {:email =>@email, :password => @raw_password }
    end

    def find_by_password
        user = Api::Accounts.new.where(parms_using_password)
        if user
            return User.new_from_params(user.to_hash)
        end
    end
end
